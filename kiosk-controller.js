/**
 * Kiosk Controller Module
 * 
 * Handles BrowserWindow creation and navigation logic.
 */

const { app, BrowserWindow } = require('electron');
const config = require('./config');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Orientation mapping from API values to Ubuntu Frame terminology
 */
const ORIENTATION_MAP = {
    'landscape': 'normal',
    'portrait_cw': 'right',
    'portrait_ccw': 'left',
    'inverted': 'inverted'
};

/**
 * Valid orientation values
 */
const VALID_ORIENTATIONS = Object.keys(ORIENTATION_MAP);

let mainWindow = null;

/**
 * Create the kiosk BrowserWindow
 * @returns {BrowserWindow} The created window
 */
function createWindow() {
    mainWindow = new BrowserWindow(config.WINDOW);

    // Detect Chromium crashes and kill the app
    mainWindow.webContents.on('render-process-gone', (event, details) => {
        console.error(`[ERROR] Renderer process gone. Reason: ${details.reason}, Exit code: ${details.exitCode}`);
        app.exit(1);
    });

    return mainWindow;
}

/**
 * Navigate the kiosk to a URL with error fallback
 * @param {string} targetUrl - The URL to navigate to
 */
function navigate(targetUrl) {
    if (!mainWindow) return;

    console.log(`[NAV] Attempting to load: ${targetUrl}`);

    mainWindow.loadURL(targetUrl).catch(err => {
        console.error(`[ERROR] Could not reach ${targetUrl}. Reason: ${err.message}`);

        // Safety check: If the error page itself fails, stop trying
        if (targetUrl.includes('error.html')) {
            console.error('[ERROR] The error page is broken too!');
            return;
        }

        // Wait before showing fallback to let Chromium reset
        setTimeout(() => {
            console.log('[NAV] Loading local error fallback...');
            
            mainWindow.loadFile(config.ERROR_PAGE, {
                query: { failedUrl: targetUrl }
            }).catch(fallbackErr => {
                console.error('[ERROR] Even the local file failed:', fallbackErr);
            });
            
        }, config.FALLBACK_DELAY_MS);
    });
}

/**
 * Load the error/waiting page
 */
function loadErrorPage() {
    if (!mainWindow) return;
    mainWindow.loadFile(config.ERROR_PAGE);
}

/**
 * Reload the current page
 */
function reload() {
    if (mainWindow && mainWindow.webContents) {
        console.log('[NAV] Reloading current page');
        mainWindow.webContents.reload();
    }
}

/**
 * Get the main window reference
 * @returns {BrowserWindow|null}
 */
function getWindow() {
    return mainWindow;
}

/**
 * Detect the connected monitor by reading the Linux DRM subsystem
 * @returns {Promise<string>} The port name (e.g., 'HDMI-A-1', 'DP-1')
 * @throws {Error} If no connected monitor is found
 */
async function detectConnectedMonitor() {
    const drmPath = '/sys/class/drm';
    
    const entries = await fs.promises.readdir(drmPath);
    
    // Filter for card entries that represent display connectors
    // Format: card0-HDMI-A-1, card0-DP-1, card1-VGA-1, etc.
    const connectorPattern = /^card(\d+)-(.+)$/;
    
    for (const entry of entries) {
        const match = entry.match(connectorPattern);
        if (!match) continue;
        
        const statusPath = path.join(drmPath, entry, 'status');
        
        try {
            const status = await fs.promises.readFile(statusPath, 'utf8');
            if (status.trim() === 'connected') {
                // Extract the port name (e.g., 'HDMI-A-1' from 'card0-HDMI-A-1')
                const portName = match[2];
                console.log(`[ORIENTATION] Detected connected monitor: ${portName}`);
                return portName;
            }
        } catch (err) {
            // Status file might not exist for some entries, skip them
            continue;
        }
    }
    
    throw new Error('No connected monitor detected');
}

/**
 * Generate YAML configuration for Ubuntu Frame display layout
 * @param {string} monitorName - The detected monitor port name
 * @param {string} orientation - The Ubuntu Frame orientation value
 * @returns {string} YAML configuration string
 */
function generateDisplayYaml(monitorName, orientation) {
    return `layouts:
  default:
    cards:
    - card-id: 0
      ${monitorName}:
        orientation: ${orientation}
`;
}

/**
 * Set the display orientation using Ubuntu Frame
 * @param {string} orientation - The orientation value ('landscape', 'portrait_cw', 'portrait_ccw', 'inverted')
 * @returns {Promise<{success: boolean, message: string, monitor?: string, orientation?: string}>}
 */
async function setOrientation(orientation) {
    const tempFilePath = '/tmp/kiosk-layout.yaml';
    
    // Validate orientation
    if (!VALID_ORIENTATIONS.includes(orientation)) {
        return {
            success: false,
            message: `Invalid orientation '${orientation}'. Valid values: ${VALID_ORIENTATIONS.join(', ')}`
        };
    }
    
    try {
        // Detect connected monitor
        const monitorName = await detectConnectedMonitor();
        
        // Map to Ubuntu Frame orientation
        const frameOrientation = ORIENTATION_MAP[orientation];
        
        // Generate YAML configuration
        const yamlConfig = generateDisplayYaml(monitorName, frameOrientation);
        console.log(`[ORIENTATION] Generated YAML config:\n${yamlConfig}`);
        
        // Write to temporary file
        await fs.promises.writeFile(tempFilePath, yamlConfig, 'utf8');
        console.log(`[ORIENTATION] Written config to ${tempFilePath}`);
        
        // Execute snap set command
        const command = `snap set ubuntu-frame display="$(cat ${tempFilePath})"`;
        console.log(`[ORIENTATION] Executing: ${command}`);
        
        const { stdout, stderr } = await execAsync(command);
        
        if (stdout) console.log(`[ORIENTATION] stdout: ${stdout}`);
        if (stderr) console.log(`[ORIENTATION] stderr: ${stderr}`);
        
        console.log(`[ORIENTATION] Successfully set orientation to '${orientation}' (${frameOrientation}) on ${monitorName}`);
        
        return {
            success: true,
            message: `Orientation set to '${orientation}'`,
            monitor: monitorName,
            orientation: frameOrientation
        };
        
    } catch (err) {
        console.error(`[ORIENTATION] Error: ${err.message}`);
        return {
            success: false,
            message: err.message
        };
    } finally {
        // Clean up temporary file
        try {
            await fs.promises.unlink(tempFilePath);
            console.log(`[ORIENTATION] Cleaned up ${tempFilePath}`);
        } catch (cleanupErr) {
            // File might not exist if we failed before writing it
            if (cleanupErr.code !== 'ENOENT') {
                console.warn(`[ORIENTATION] Failed to clean up temp file: ${cleanupErr.message}`);
            }
        }
    }
}

module.exports = {
    createWindow,
    navigate,
    loadErrorPage,
    reload,
    getWindow,
    setOrientation,
    VALID_ORIENTATIONS,
};

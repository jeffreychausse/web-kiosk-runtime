/**
 * Kiosk Controller Module
 * 
 * Handles BrowserWindow creation and navigation logic.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const config = require('./config');

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
        if (targetUrl.includes(config.ERROR_PAGE)) {
            console.error('[ERROR] The error page is broken too!');
            return;
        }

        // Wait before showing fallback to let Chromium reset
        setTimeout(() => {
            console.log('[NAV] Loading local error fallback...');
            
            mainWindow.loadFile(path.join(__dirname, config.ERROR_PAGE), {
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
    mainWindow.loadFile(path.join(__dirname, config.ERROR_PAGE));
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

module.exports = {
    createWindow,
    navigate,
    loadErrorPage,
    reload,
    getWindow,
};
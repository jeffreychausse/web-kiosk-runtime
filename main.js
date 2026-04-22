const { app, BrowserWindow } = require('electron');
const Store = require('electron-store');
const express = require('express');
const log = require('electron-log');
const path = require('path');

// Import Tasktoolkit integration
const tasktoolkit = require('./tasktoolkit-integration');

// --- LOGGING & ROTATION CONFIGURATION ---

log.transports.file.maxSize = 5 * 1024 * 1024; // Set the maximum log file size to 5MB (Default is 1MB). When it hits 5MB, it renames the file to main.old.log and starts a new one.
log.errorHandler.startCatching(); //Automatically catch unhandled exceptions and promise rejections
Object.assign(console, log.functions); // Forward console calls to log file

console.log('Kiosk boot sequence initiated...');
console.log('Log file location:', log.transports.file.getFile().path);

// 1. Setup Persistence & API
const store = new Store({
    cwd: __dirname,           // Tells it to save exactly where main.js lives
    name: 'kiosk-settings'    // Names the file kiosk-settings.json
});
const server = express();
const PORT = 3333;

console.log(`[SYSTEM] Memory File Location: ${store.path}`);

let mainWindow;

// 2. Middleware & Debugging
server.use(express.json());

server.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url}`);
    next();
});

// 3. Navigation Helper
function navigateKiosk(targetUrl) {
    if (!mainWindow) return;

    console.log(`[NAV] Attempting to load: ${targetUrl}`);

    // Update Tasktoolkit status
    tasktoolkit.updateStatus({ currentUrl: targetUrl });

    // Try to load the URL
    mainWindow.loadURL(targetUrl).catch(err => {
        console.error(`[CRASH] Could not reach ${targetUrl}. Reason: ${err.message}`);

        // Safety check: If the error page itself fails, stop trying so we don't loop forever
        if (targetUrl.includes('error.html')) {
            console.error("The error page is broken too!");
            return;
        }

        // Wait half a second so Chromium completely forgets about the dead URL
        setTimeout(() => {
            console.log("[NAV] Loading local error fallback...");
            
            mainWindow.loadFile(path.join(__dirname, 'error.html'), {
                query: { failedUrl: targetUrl }
            }).catch(fallbackErr => {
                console.error("[CRITICAL FATAL] Even the local file failed:", fallbackErr);
            });
            
        }, 500); 
    });
}

// Helper function to set URL (used by both API and Tasktoolkit)
function setKioskUrl(newUrl) {
    console.log(`[SUCCESS] Updating Kiosk to: ${newUrl}`);
    store.set('kioskUrl', newUrl);
    navigateKiosk(newUrl);
}

// Helper function to reload the current page
function reloadKioskPage() {
    if (mainWindow && mainWindow.webContents) {
        console.log('[NAV] Reloading current page');
        mainWindow.webContents.reload();
    }
}

// 4. The API Route
server.post('/set-url', (req, res) => {
    const newUrl = req.body.url;

    if (newUrl) {
        setKioskUrl(newUrl);
        res.json({ status: "success", url: newUrl });
    } else {
        res.status(400).json({ status: "error", message: "Missing url parameter" });
    }
});

// 5. Electron Window Logic
function createWindow() {
    // 1. Create the window object FIRST
    mainWindow = new BrowserWindow({
        fullscreen: true,
        kiosk: true,
        backgroundColor: '#000000',
        webPreferences: { 
            contextIsolation: true 
        }
    });

    // 2. Initialize Tasktoolkit after window is created
    const tasktoolkitInitialized = tasktoolkit.init({
        setUrl: setKioskUrl,
        reloadPage: reloadKioskPage,
    });

    if (tasktoolkitInitialized) {
        console.log('[SYSTEM] Tasktoolkit integration active');
    } else {
        console.warn('[SYSTEM] Tasktoolkit integration failed to initialize');
    }

    // 3. Decide what to load
    const savedUrl = store.get('kioskUrl');

    if (savedUrl && savedUrl.length > 0) {
        console.log(`[BOOT] Found memory. Loading saved URL.`);
        navigateKiosk(savedUrl);
    } else {
        console.log("[BOOT] No URL saved. Loading 'Waiting' screen.");
        mainWindow.loadFile(path.join(__dirname, 'error.html'));
        // Update Tasktoolkit with empty URL state
        tasktoolkit.updateStatus({ currentUrl: '' });
    }
}

app.whenReady().then(createWindow);

// Handle app quit - cleanup Tasktoolkit
app.on('before-quit', () => {
    console.log('[SYSTEM] Application quitting, cleaning up...');
    tasktoolkit.cleanup();
});

app.on('window-all-closed', (e) => e.preventDefault());

// 6. Start API Server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Kiosk API listening on port ${PORT}`);
});
/**
 * Kiosk App - Main Entry Point
 * 
 * Orchestrates the kiosk application lifecycle.
 */

// Load environment variables first (before any other requires)
require('dotenv').config({ path: __dirname + '/.env' });

const { app } = require('electron');
const Store = require('electron-store');
const log = require('electron-log');

const config = require('./config');
const kioskController = require('./kiosk-controller');
const createApiServer = require('./api-server');
const tasktoolkit = require('./tasktoolkit-integration');

// --- Logging Configuration ---
log.transports.file.maxSize = config.LOG_MAX_SIZE;
log.errorHandler.startCatching();
Object.assign(console, log.functions);

console.log('[BOOT] Kiosk boot sequence initiated...');
console.log('[INFO] Log file location:', log.transports.file.getFile().path);

// --- Persistence Setup ---
const store = new Store({
    cwd: __dirname,
    name: config.STORE.name,
});

console.log(`[INFO] Settings file location: ${store.path}`);

// --- URL Management ---

/**
 * Set the kiosk URL (saves to store and navigates)
 * @param {string} newUrl - The URL to set
 */
function setKioskUrl(newUrl) {
    console.log(`[INFO] Updating Kiosk to: ${newUrl}`);
    store.set('kioskUrl', newUrl);
    tasktoolkit.updateStatus({ currentUrl: newUrl });
    kioskController.navigate(newUrl);
}

/**
 * Reload the current kiosk page
 */
function reloadKioskPage() {
    kioskController.reload();
}

// --- Application Lifecycle ---

function onReady() {
    // Create the window
    kioskController.createWindow();

    // Initialize Tasktoolkit
    const tasktoolkitInitialized = tasktoolkit.init({
        setUrl: setKioskUrl,
        reloadPage: reloadKioskPage,
    });

    if (tasktoolkitInitialized) {
        console.log('[INFO] Tasktoolkit integration active');
    } else {
        console.warn('[INFO] Tasktoolkit integration failed to initialize');
    }

    // Load saved URL or show waiting screen
    const savedUrl = store.get('kioskUrl');

    if (savedUrl && savedUrl.length > 0) {
        console.log('[BOOT] Found saved URL. Loading...');
        tasktoolkit.updateStatus({ currentUrl: savedUrl });
        kioskController.navigate(savedUrl);
    } else {
        console.log('[BOOT] No URL saved. Loading waiting screen.');
        kioskController.loadErrorPage();
        tasktoolkit.updateStatus({ currentUrl: '' });
    }
}

function onBeforeQuit() {
    console.log('[INFO] Application quitting, cleaning up...');
    tasktoolkit.cleanup();
}

function onWindowAllClosed(e) {
    e.preventDefault();
}

// --- Event Handlers ---
app.whenReady().then(onReady);
app.on('before-quit', onBeforeQuit);
app.on('window-all-closed', onWindowAllClosed);

// --- API Server ---
const server = createApiServer({
    setUrl: setKioskUrl,
    getUrl: () => store.get('kioskUrl') || '',
    reloadPage: reloadKioskPage,
});

server.listen(config.PORT, '0.0.0.0', () => {
    console.log(`[INFO] Kiosk API listening on port ${config.PORT}`);
});
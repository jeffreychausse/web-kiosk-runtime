/**
 * Centralized Configuration for Web Kiosk Runtime
 */

const paths = require('./paths');

module.exports = {
    // API Server
    PORT: parseInt(process.env.API_PORT, 10),
    
    // Logging
    LOG_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    
    // Navigation
    ERROR_PAGE: paths.ERROR_PAGE,
    FALLBACK_DELAY_MS: 500,
    
    // Electron Window
    WINDOW: {
        fullscreen: true,
        kiosk: true,
        backgroundColor: '#000000',
        webPreferences: {
            contextIsolation: true,
        },
    },
    
    // Persistence
    STORE: {
        name: 'kiosk-settings',
    },
};

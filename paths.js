/**
 * Dynamic Path Configuration for Web Kiosk Runtime
 * 
 * Computes paths based on whether running in development or production.
 * - Development: Uses the source directory (__dirname)
 * - Production: Uses /opt/web-kiosk-runtime (electron-builder install location)
 */

const { app } = require('electron');
const path = require('path');

// Determine base path based on packaging status
const BASE_PATH = app.isPackaged ? '/opt/web-kiosk-runtime' : __dirname;

module.exports = {
    // Base directory
    BASE_PATH,
    
    // Environment configuration
    ENV_FILE: path.join(BASE_PATH, '.env'),
    
    // Static assets
    ERROR_PAGE: path.join(BASE_PATH, 'error.html'),
    ASSETS_DIR: path.join(BASE_PATH, 'assets'),
    
    // Libraries
    LIB_DIR: path.join(BASE_PATH, 'lib'),
    TASKTOOLKIT_DIR: path.join(BASE_PATH, 'lib', 'tasktoolkit'),
    
    // Persistence (electron-store directory)
    STORE_DIR: BASE_PATH,
    
    // Helper to check if running in production
    isProduction: app.isPackaged,
};
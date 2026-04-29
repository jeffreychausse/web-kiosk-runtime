/**
 * API Server Module
 * 
 * Express server for kiosk control API.
 */

const express = require('express');

/**
 * Create and configure the API server
 * @param {Function} setUrlCallback - Function to call when URL is set
 * @returns {express.Application} The configured Express app
 */
function createApiServer(setUrlCallback) {
    const server = express();

    // Middleware
    server.use(express.json());

    // Request logging
    server.use((req, res, next) => {
        console.log(`[DEBUG] ${req.method} ${req.url}`);
        next();
    });

    // Routes
    server.post('/set-url', (req, res) => {
        const newUrl = req.body.url;

        if (newUrl) {
            setUrlCallback(newUrl);
            res.json({ status: 'success', url: newUrl });
        } else {
            res.status(400).json({ status: 'error', message: 'Missing url parameter' });
        }
    });

    return server;
}

module.exports = createApiServer;
/**
 * API Server Module
 * 
 * Express server for kiosk control API.
 */

const express = require('express');

/**
 * Create and configure the API server
 * @param {Object} callbacks - Callback functions for kiosk control
 * @param {Function} callbacks.setUrl - Function to set the kiosk URL
 * @param {Function} callbacks.getUrl - Function to get the current URL
 * @param {Function} callbacks.reloadPage - Function to reload the current page
 * @param {Function} callbacks.setOrientation - Function to set display orientation
 * @returns {express.Application} The configured Express app
 */
function createApiServer(callbacks) {
    const { setUrl, getUrl, reloadPage, setOrientation } = callbacks;
    const server = express();

    // Middleware
    server.use(express.json());

    // Request logging
    server.use((req, res, next) => {
        console.log(`[DEBUG] ${req.method} ${req.url}`);
        next();
    });

    // Routes

    // Get current URL
    server.get('/url', (req, res) => {
        const currentUrl = getUrl();
        res.json({ status: 'success', url: currentUrl });
    });

    // Set URL
    server.post('/set-url', (req, res) => {
        const newUrl = req.body.url;

        if (newUrl) {
            setUrl(newUrl);
            res.json({ status: 'success', url: newUrl });
        } else {
            res.status(400).json({ status: 'error', message: 'Missing url parameter' });
        }
    });

    // Reload page
    server.post('/reload', (req, res) => {
        reloadPage();
        res.json({ status: 'success', message: 'Page reload triggered' });
    });

    // Set display orientation
    server.post('/api/settings/orientation', async (req, res) => {
        const { orientation } = req.body;

        if (!orientation) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing orientation parameter'
            });
        }

        try {
            const result = await setOrientation(orientation);

            if (result.success) {
                res.json({
                    status: 'success',
                    message: result.message,
                    monitor: result.monitor,
                    orientation: result.orientation
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: result.message
                });
            }
        } catch (err) {
            console.error(`[API] Orientation error: ${err.message}`);
            res.status(500).json({
                status: 'error',
                message: `Internal server error: ${err.message}`
            });
        }
    });

    return server;
}

module.exports = createApiServer;

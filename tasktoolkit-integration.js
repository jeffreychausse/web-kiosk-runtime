/**
 * Tasktoolkit Integration Module for Kiosk App
 * 
 * This module handles all communication with Moment Factory's Control Center
 * via the Tasktoolkit library.
 */

// === TASKTOOLKIT CONFIGURATION (loaded from environment variables) ===
const CONFIG = {
    projectId: process.env.TASKTOOLKIT_PROJECT_ID,
    mqttBroker: process.env.TASKTOOLKIT_MQTT_BROKER,
    datastoreHost: process.env.TASKTOOLKIT_DATASTORE_HOST,
    softwareName: process.env.TASKTOOLKIT_SOFTWARE_NAME,
    softwareDisplayName: process.env.TASKTOOLKIT_SOFTWARE_DISPLAY_NAME,
    catalogName: process.env.TASKTOOLKIT_CATALOG_NAME,
    localIp: process.env.TASKTOOLKIT_LOCAL_IP,
    updateIntervalMs: parseInt(process.env.TASKTOOLKIT_UPDATE_INTERVAL_MS, 10),
};

// Load the Tasktoolkit library
const CCTasktoolkit = require('./lib/tasktoolkit/Tasktoolkit');

// Module state
let toolkitProvider = null;
let updateInterval = null;
let isInitialized = false;
let appCallbacks = null;
let startTime = Date.now();

// Current status state
let currentStatus = {
    currentUrl: '',
    uptime: 0,
    lastUrlChange: null,
};

// Callback references (must remain in scope)
let logCallback = null;
let mqttConnectionChangedCallback = null;
let controlCenterConnectionEstablishedCallback = null;
let refreshTaskCallback = null;
let onVariablesUpdateRefreshCallback = null;
let taskExecuteReceivedCallback = null;
let onRequestLocalIpQueryCallback = null;

/**
 * Publish the task catalog to Control Center
 */
function publishTaskCatalog() {
    if (!toolkitProvider) return;

    console.log('[TASKTOOLKIT] Publishing task catalog...');

    toolkitProvider.Publish.BeginCatalog(0);

    // Create task group
    toolkitProvider.Publish.CreateTaskGroup('KioskControl', 'Kiosk Control');

    // Task: Set URL
    toolkitProvider.Publish.CreateActionTask(
        'SetURL',
        'Set Kiosk URL',
        'Navigate the kiosk browser to a new URL',
        10000 // 10 second timeout
    );
    toolkitProvider.Publish.CreateParameter(
        'url',
        'URL',
        'The URL to navigate to',
        CCTasktoolkit.CCTaskToolkitParameterDataType.String,
        true // required
    );
    toolkitProvider.Publish.SetParameterDefaultValue('https://');

    // Task: Reload Page
    toolkitProvider.Publish.CreateActionTask(
        'ReloadPage',
        'Reload Page',
        'Reload the current page in the kiosk browser',
        5000 // 5 second timeout
    );

    toolkitProvider.Publish.EndCatalog(true);
    console.log('[TASKTOOLKIT] Task catalog published.');
}

/**
 * Publish variables to Control Center
 */
function publishVariables() {
    if (!toolkitProvider) return;

    // Update uptime
    currentStatus.uptime = Math.floor((Date.now() - startTime) / 1000);

    // Publish KioskStatus as JSON variable
    toolkitProvider.Publish.BeginVariable(
        'KioskStatus',
        CCTasktoolkit.CCTaskToolkitVariableDataType.JSON,
        false
    );
    
    toolkitProvider.Publish.AddDatastoreVariableTag('Kiosk');
    toolkitProvider.Publish.AddDatastoreVariableTag('Status');
    toolkitProvider.Publish.SetDatastoreVariableUpdateValueInDatabase(true);
    
    toolkitProvider.Publish.SetDatastoreJSONVariableValue(JSON.stringify(currentStatus));
    
    toolkitProvider.Publish.EndDatastoreVariable(true);
}

/**
 * Set up all Tasktoolkit callbacks
 */
function setupCallbacks() {
    // Log callback - receives API logs
    logCallback = toolkitProvider.Delegate.createCallbackFrom(
        toolkitProvider.Delegate.CCTaskToolkitLogCallbackDelegate,
        (timestamp, moduleName, level, versus, func, line, threadId, callstack, msg) => {
            // Only log warnings and errors to avoid spam
            if (level >= CCTasktoolkit.CCTaskToolkitLogLevel.Warning) {
                console.log(`[TASKTOOLKIT LOG] ${msg}`);
            }
        }
    );

    // MQTT connection changed callback
    mqttConnectionChangedCallback = toolkitProvider.Delegate.createCallbackFrom(
        toolkitProvider.Delegate.CCTaskToolkitMQTTConnectionChangedCallback,
        (connected) => {
            if (connected) {
                console.log('[TASKTOOLKIT] MQTT Connected');
            } else {
                console.log('[TASKTOOLKIT] MQTT Disconnected');
            }
        }
    );

    // Control Center connection established callback
    controlCenterConnectionEstablishedCallback = toolkitProvider.Delegate.createCallbackFrom(
        toolkitProvider.Delegate.CCTaskToolkitControlCenterConnectionEstablishedCallback,
        (ccVersion) => {
            console.log(`[TASKTOOLKIT] Control Center ${ccVersion} connection established`);
            publishTaskCatalog();
        }
    );

    // Refresh task callback - CC requests task catalog refresh
    refreshTaskCallback = toolkitProvider.Delegate.createCallbackFrom(
        toolkitProvider.Delegate.CCTaskToolkitRefreshTaskCallback,
        () => {
            console.log('[TASKTOOLKIT] Task catalog refresh requested');
            publishTaskCatalog();
        }
    );

    // Variables update callback - CC requests variable update
    onVariablesUpdateRefreshCallback = toolkitProvider.Delegate.createCallbackFrom(
        toolkitProvider.Delegate.CCTaskToolkitOnVariablesUpdateRefreshDelegate,
        () => {
            publishVariables();
        }
    );

    // Task execution callback - CC requests task execution
    taskExecuteReceivedCallback = toolkitProvider.Delegate.createCallbackFrom(
        toolkitProvider.Delegate.CCTaskToolkitTaskExecuteReceivedCallback,
        (taskName, taskNameStrLength, jsonTaskParam, jsonTaskParamStrLength, taskuid) => {
            console.log(`[TASKTOOLKIT] Task received: ${taskName}`);
            
            try {
                const params = JSON.parse(jsonTaskParam);

                if (taskName === 'SetURL') {
                    // Find the URL parameter
                    const urlParam = params.find(p => p.internalName === 'url');
                    if (urlParam && urlParam.value) {
                        const newUrl = urlParam.value;
                        console.log(`[TASKTOOLKIT] SetURL task: ${newUrl}`);
                        
                        if (appCallbacks && appCallbacks.setUrl) {
                            appCallbacks.setUrl(newUrl);
                            
                            const feedback = `URL set to: ${newUrl}`;
                            toolkitProvider.Logic.SetTaskExecutionFeedback(feedback, feedback.length, '', 0);
                            return CCTasktoolkit.CCTaskToolkitTaskExecutionResult.Success;
                        } else {
                            const feedback = 'setUrl callback not available';
                            toolkitProvider.Logic.SetTaskExecutionFeedback(feedback, feedback.length, '', 0);
                            return CCTasktoolkit.CCTaskToolkitTaskExecutionResult.Error;
                        }
                    } else {
                        const feedback = 'Missing URL parameter';
                        toolkitProvider.Logic.SetTaskExecutionFeedback(feedback, feedback.length, '', 0);
                        return CCTasktoolkit.CCTaskToolkitTaskExecutionResult.Error;
                    }
                } else if (taskName === 'ReloadPage') {
                    console.log('[TASKTOOLKIT] ReloadPage task');
                    
                    if (appCallbacks && appCallbacks.reloadPage) {
                        appCallbacks.reloadPage();
                        
                        const feedback = 'Page reloaded';
                        toolkitProvider.Logic.SetTaskExecutionFeedback(feedback, feedback.length, '', 0);
                        return CCTasktoolkit.CCTaskToolkitTaskExecutionResult.Success;
                    } else {
                        const feedback = 'reloadPage callback not available';
                        toolkitProvider.Logic.SetTaskExecutionFeedback(feedback, feedback.length, '', 0);
                        return CCTasktoolkit.CCTaskToolkitTaskExecutionResult.Error;
                    }
                } else {
                    const feedback = `Unknown task: ${taskName}`;
                    toolkitProvider.Logic.SetTaskExecutionFeedback(feedback, feedback.length, '', 0);
                    return CCTasktoolkit.CCTaskToolkitTaskExecutionResult.Error;
                }
            } catch (err) {
                const feedback = `Error executing task: ${err.message}`;
                toolkitProvider.Logic.SetTaskExecutionFeedback(feedback, feedback.length, '', 0);
                return CCTasktoolkit.CCTaskToolkitTaskExecutionResult.Error;
            }
        }
    );

    // Local IP query callback
    onRequestLocalIpQueryCallback = toolkitProvider.Delegate.createCallbackFrom(
        toolkitProvider.Delegate.CCTaskToolkitOnRequestLocalIpQuery,
        (strBuffer, strBufferSize) => {
            toolkitProvider.Config.SetLocalIP(CONFIG.localIp);
            return 0;
        }
    );

    // Register callbacks with the API
    toolkitProvider.Callback.setAPILoggerCallback(logCallback);
    toolkitProvider.Callback.setMQTTConnectionChangedCallback(mqttConnectionChangedCallback);
    toolkitProvider.Callback.setControlCenterConnectionEstablishedCallback(controlCenterConnectionEstablishedCallback);
    toolkitProvider.Callback.setRefreshTaskCallback(refreshTaskCallback);
    toolkitProvider.Callback.setOnVariablesUpdateRefreshCallback(onVariablesUpdateRefreshCallback);
    toolkitProvider.Callback.setTaskExecuteReceivedCallback(taskExecuteReceivedCallback);
    toolkitProvider.Callback.setOnRequestLocalIpQuery(onRequestLocalIpQueryCallback);
}

/**
 * Destroy all callbacks (cleanup)
 */
function destroyCallbacks() {
    if (!toolkitProvider) return;

    if (onRequestLocalIpQueryCallback) {
        toolkitProvider.Delegate.destroyCallback(onRequestLocalIpQueryCallback);
        onRequestLocalIpQueryCallback = null;
    }
    if (onVariablesUpdateRefreshCallback) {
        toolkitProvider.Delegate.destroyCallback(onVariablesUpdateRefreshCallback);
        onVariablesUpdateRefreshCallback = null;
    }
    if (refreshTaskCallback) {
        toolkitProvider.Delegate.destroyCallback(refreshTaskCallback);
        refreshTaskCallback = null;
    }
    if (controlCenterConnectionEstablishedCallback) {
        toolkitProvider.Delegate.destroyCallback(controlCenterConnectionEstablishedCallback);
        controlCenterConnectionEstablishedCallback = null;
    }
    if (mqttConnectionChangedCallback) {
        toolkitProvider.Delegate.destroyCallback(mqttConnectionChangedCallback);
        mqttConnectionChangedCallback = null;
    }
    if (taskExecuteReceivedCallback) {
        toolkitProvider.Delegate.destroyCallback(taskExecuteReceivedCallback);
        taskExecuteReceivedCallback = null;
    }
    if (logCallback) {
        toolkitProvider.Delegate.destroyCallback(logCallback);
        logCallback = null;
    }
}

/**
 * Initialize the Tasktoolkit integration
 * @param {Object} callbacks - Callbacks object with setUrl and reloadPage functions
 * @param {Function} callbacks.setUrl - Function to call when SetURL task is received
 * @param {Function} callbacks.reloadPage - Function to call when ReloadPage task is received
 * @returns {boolean} - True if initialization was successful
 */
function init(callbacks) {
    if (isInitialized) {
        console.warn('[TASKTOOLKIT] Already initialized');
        return false;
    }

    if (!callbacks || !callbacks.setUrl || !callbacks.reloadPage) {
        console.error('[TASKTOOLKIT] Missing required callbacks (setUrl, reloadPage)');
        return false;
    }

    appCallbacks = callbacks;
    startTime = Date.now();

    try {
        console.log('[TASKTOOLKIT] Initializing...');

        // Create the provider
        toolkitProvider = new CCTasktoolkit.CCTasktoolkitProvider();

        // Install the API with required flags
        toolkitProvider.Logic.installAPI(
            CCTasktoolkit.CCTaskToolkitInitParameters.CallbackLogger |
            CCTasktoolkit.CCTaskToolkitInitParameters.SingleThreadedCallbacks
        );

        // Configure software name
        toolkitProvider.Config.SetSoftwareName(CONFIG.softwareName, CONFIG.softwareDisplayName);
        toolkitProvider.Config.SetCatalogName(CONFIG.catalogName);

        // Set up callbacks before initialization
        setupCallbacks();

        // Initialize the API
        toolkitProvider.Logic.initializeAPI();

        // Configure connection (can be done after init)
        if (CONFIG.datastoreHost && CONFIG.datastoreHost !== 'YOUR_DATASTORE_HOST') {
            toolkitProvider.Config.SetDatastoreHost(CONFIG.datastoreHost, true);
        }
        if (CONFIG.mqttBroker && CONFIG.mqttBroker !== 'YOUR_MQTT_BROKER') {
            toolkitProvider.Config.SetMqttBrokerHost(CONFIG.mqttBroker, true);
        }
        if (CONFIG.projectId && CONFIG.projectId !== 'YOUR_PROJECT_ID') {
            toolkitProvider.Config.SetProjectIdentifier(CONFIG.projectId);
        }

        // Start the update loop
        updateInterval = setInterval(() => {
            if (toolkitProvider) {
                toolkitProvider.Logic.APIUpdate();
            }
        }, CONFIG.updateIntervalMs);

        isInitialized = true;
        console.log('[TASKTOOLKIT] Initialization complete');
        return true;

    } catch (err) {
        console.error('[TASKTOOLKIT] Initialization failed:', err.message);
        cleanup();
        return false;
    }
}

/**
 * Update the current status
 * @param {Object} status - Status object to merge with current status
 * @param {string} [status.currentUrl] - Current URL being displayed
 */
function updateStatus(status) {
    if (status.currentUrl !== undefined) {
        currentStatus.currentUrl = status.currentUrl;
        currentStatus.lastUrlChange = new Date().toISOString();
    }
}

/**
 * Cleanup the Tasktoolkit integration
 */
function cleanup() {
    console.log('[TASKTOOLKIT] Cleaning up...');

    // Stop the update loop
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }

    // Cleanup the API
    if (toolkitProvider && isInitialized) {
        try {
            toolkitProvider.Logic.cleanUpAPI();
        } catch (err) {
            console.error('[TASKTOOLKIT] Cleanup API error:', err.message);
        }
    }

    // Destroy callbacks
    destroyCallbacks();

    toolkitProvider = null;
    isInitialized = false;
    appCallbacks = null;

    console.log('[TASKTOOLKIT] Cleanup complete');
}

/**
 * Check if Tasktoolkit is initialized
 * @returns {boolean}
 */
function isReady() {
    return isInitialized;
}

// Module exports
module.exports = {
    init,
    cleanup,
    updateStatus,
    isReady,
    CONFIG,
};

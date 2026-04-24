/*
Copyright 2023 Moment Factory Studios Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const CCTasktoolkit = require('./Tasktoolkit')



// This provider is the base interface for accessing tasktoolkit exposed methods.
var toolkitProvider = new CCTasktoolkit.CCTasktoolkitProvider();



// You need to store callbacks into unscoped variables using Delegate.createCallbackFrom.
// toolkitProvider.Delegate has a list of callback prototypes to be used as 1st parameters (see members).
//
var logCallback = toolkitProvider.Delegate.createCallbackFrom(toolkitProvider.Delegate.CCTaskToolkitLogCallbackDelegate, (timestamp, moduleName, level, versus, func, line, threadId, callstack, msg) => {
	console.log(msg);
});

var connectionCallback = toolkitProvider.Delegate.createCallbackFrom(toolkitProvider.Delegate.CCTaskToolkitPulseOnConnectedCallback, (connected) => {
	if (connected) {
		console.log('Connected');
	} else {
		console.log('Disconnected');
	}
});



// Call Logic.installAPI using CCTasktoolkit.CCTaskToolkitInitParameters flags to allocate the API.
//
// IMPORTANT NOTE FOR JAVASCRIPT : you must add CCTasktoolkit.CCTaskToolkitInitParameters.SingleThreadedCallbacks.
toolkitProvider.Logic.installAPI(CCTasktoolkit.CCTaskToolkitInitParameters.NoShowControl | CCTasktoolkit.CCTaskToolkitInitParameters.WithPulse | CCTasktoolkit.CCTaskToolkitInitParameters.CallbackLogger | CCTasktoolkit.CCTaskToolkitInitParameters.SingleThreadedCallbacks);



// Do some pre start stuff here, like setting callbacks, telling the software name uses this tasktoolkit, ...
toolkitProvider.Callback.setAPILoggerCallback(logCallback);
toolkitProvider.Pulse.setOnConnectedCallback(connectionCallback);

toolkitProvider.Config.SetSoftwareName('NodeJS', 'Node.js');

// Connection settings can be done/changed anytime.
toolkitProvider.Pulse.SetupPulseID('TestJS', 'JSArea', 'JSTest', null);
toolkitProvider.Pulse.SetupConnectionSettings('127.0.0.1', CCTasktoolkit.PulseConnectionMode.MQTT);



// Once pre-start was made, call Logic.initializeAPI to start the API.
toolkitProvider.Logic.initializeAPI();



// Main update loop.
//
// Note : This is just a POC example, do not use as-is. See next comments to see what's really important.
const start = Date.now();
while (Date.now() - start < 20000) {
	const startSleep = Date.now();
	while (Date.now() - startSleep < 33){ }
	
	// Call Logic.APIUpdate() to process any messages queued in callbacks that needs to be run by Javascript engine.
	// Pulse users should also call Pulse.NotifyNewFrame each frame to update heartbeat values.
	toolkitProvider.Pulse.NotifyNewFrame(30.0, 0);
	toolkitProvider.Logic.APIUpdate();
}



// When leaving the application.

// For Pulse users : notify the cause of the exit. If 2nd argument is true, you'll send the exit reason immediately, otherwise you'll differ until API cleanup. 
toolkitProvider.Pulse.NotifyExitCause('Normal timed Exit', true);

// API cleanup. Closes and releases all ressources the low-level API still owns. You must all install again after calling cleanup.
toolkitProvider.Logic.cleanUpAPI();


console.log('Low-level API stopped and destroyed.');

// Don't forget to destroy the callback variables using Delegate.destroyCallback because Javascript ffi engine has limited resources.
// Since for singlethread Javascript engine (we expected CCTasktoolkit.CCTaskToolkitInitParameters.SingleThreadedCallbacks), callbacks should have been called inside Logic.APIUpdate, then you can destroy callbacks anytime.
// But be sure the callbacks aren't used anymore.
toolkitProvider.Delegate.destroyCallback(connectionCallback);
toolkitProvider.Delegate.destroyCallback(logCallback);



console.log('Test END');
process.exit();


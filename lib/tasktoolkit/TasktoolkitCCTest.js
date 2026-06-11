/*
Copyright 2023 Moment Factory Studios Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const CCTasktoolkit = require('./Tasktoolkit')

// This provider is the base interface for accessing tasktoolkit exposed methods.
var toolkitProvider = new CCTasktoolkit.CCTasktoolkitProvider();



function publishTaskCatalog() {

	// The API is built analogous to OpenGL.
	// Begin/End encapsulate the API. Then any call to method will applies to the latest create method of the same object.
	// You cannot come back to a formerly created order object so be sure to set everything before moving on.

	// Start the publish declaration with a call to BeginCatalog.
	toolkitProvider.Publish.BeginCatalog(0);



	// Creating a task Group. All methods operating on a task group will execute on the last created one, that is : this one.
	toolkitProvider.Publish.CreateTaskGroup('GroupInternalName', 'My Group');


	// Create an action task on 'GroupInternalName' task group (the last one created). All method applying on a task applies to this one because it is the latest created.
	toolkitProvider.Publish.CreateActionTask('PrintTask', 'Print', 'Print something to javascript console as an example.', 5000);

	// Create a parameter for the latest task created. Here the PrintTask.
	toolkitProvider.Publish.CreateParameter('PrintMessage', 'Message', 'The Message to print with Print task', CCTasktoolkit.CCTaskToolkitParameterDataType.String, true);

	// Applies on the lastes Parameter created. Here 'PrintMessage'.
	toolkitProvider.Publish.SetParameterDefaultValue('Hello World!');



	// We created a new Task. 'PrintTask' declaration is finished (frozen) and we move on to the new one. All methods call after will now apply to this new one.
	toolkitProvider.Publish.CreateActionTask('Task_Error', 'Return Error feedback', 'Return an error', 5000);

	// Applies to last created task : Task_Error
	toolkitProvider.Publish.SetTaskIcon('alarm_add');

	// A new parameter for 'Task_Error'.
	toolkitProvider.Publish.CreateParameter('TaskErrorArg', 'Some Integer', 'An Integer argument to Return Error feedback command', CCTasktoolkit.CCTaskToolkitParameterDataType.Integer, true);
	toolkitProvider.Publish.SetParameterDefaultValue('0');



	// Here we have :
	// My Group
	//		-> Print
	//			-> Message (type : String, default value : Hello World!)
	//		-> Return Error feedback (icon : alarm_add)
	//			-> Some Integer (type : Integer, default value : 0)


	// Stop the publish declaration with a call to EndCatalog. This call send the catalog to CC when true is passed as argument.
	// Otherwise, you can deffer the publishing and call toolkitProvider.Publish.PublishCatalog later.
	toolkitProvider.Publish.EndCatalog(true);
}


function publishVariables() {
	// Except for Begin/End (Since this is called from publish callback the API control the time it calls it), the thinking is the same as the catalog publishing.

	// A raw Json
	toolkitProvider.Publish.BeginVariable("tasktoolkitsdk-testjsonvariable", CCTasktoolkit.CCTaskToolkitVariableDataType.JSON, true);
	toolkitProvider.Publish.SetDatastoreJSONVariableValue("{ \"param1\": 2.0 }");
	toolkitProvider.Publish.EndDatastoreVariable(true);



	// Float
	toolkitProvider.Publish.BeginVariable("My Variable Float", CCTasktoolkit.CCTaskToolkitVariableDataType.Float, false);

	toolkitProvider.Publish.AddDatastoreVariableTag("TestCs");
	toolkitProvider.Publish.AddDatastoreVariableTag("Numeric");
	toolkitProvider.Publish.AddDatastoreVariableTag("Tasktoolkit");
	toolkitProvider.Publish.SetDatastoreVariableUpdateValueInDatabase(true);

	toolkitProvider.Publish.SetDatastoreFloatVariableValue(100.0);


	toolkitProvider.Publish.EndDatastoreVariable(true);



	// String
	toolkitProvider.Publish.BeginVariable("My Variable String", CCTasktoolkit.CCTaskToolkitVariableDataType.String, false);

	toolkitProvider.Publish.AddDatastoreVariableTag("TestCs");
	toolkitProvider.Publish.AddDatastoreVariableTag("Litteral");
	toolkitProvider.Publish.AddDatastoreVariableTag("Tasktoolkit");
	toolkitProvider.Publish.SetDatastoreVariableUpdateValueInDatabase(true);

	toolkitProvider.Publish.SetDatastoreStringVariableValue('Some String variable youhouuuuu');

	toolkitProvider.Publish.EndDatastoreVariable(true);


	// Dictionnary
	toolkitProvider.Publish.BeginVariable("My Variable Dictionnary", CCTasktoolkit.CCTaskToolkitVariableDataType.Dictionnary, false);

	toolkitProvider.Publish.AddDatastoreVariableTag("TestCs");
	toolkitProvider.Publish.AddDatastoreVariableTag("Dict");
	toolkitProvider.Publish.AddDatastoreVariableTag("Tasktoolkit");
	toolkitProvider.Publish.SetDatastoreVariableUpdateValueInDatabase(true);

	toolkitProvider.Publish.AddDictionnaryMapping("Value 1", 1);
	toolkitProvider.Publish.AddDictionnaryMapping("Value 2", 2);
	toolkitProvider.Publish.AddDictionnaryMapping("Value 425", 425);
	toolkitProvider.Publish.AddDictionnaryMapping("Something", 384);

	toolkitProvider.Publish.EndDatastoreVariable(true);

	// ...
}

function setupCCConnection() {
	// facultative if connecting to a CC > 4.16
	// toolkitProvider.Config.SetProjectIdentifier('test');

	toolkitProvider.Config.SetCatalogName('My Catalog Name NodeJS Test');
	toolkitProvider.Config.SetDatastoreHost('xagora-synodev', true);

	// facultative if connecting to a CC > 4.16
	// toolkitProvider.Config.SetMqttBrokerHost('10.10.100.213', true);
}

// Main update loop.
function mainLoop() {
	// Note : This is just a POC example, do not use as-is. See next comments to see what's really important.
	const start = Date.now();
	while (true) {
		const startSleep = Date.now();
		while (Date.now() - startSleep < 33) { }

		// Call Logic.APIUpdate() to process any messages queued in callbacks that needs to be run by Javascript engine.
		toolkitProvider.Logic.APIUpdate();
	}
}



/**
 * CALLBACK DECLARATION. Callbacks variables must be alive throughout the API
 */
// You need to store callbacks into unscoped variables using Delegate.createCallbackFrom.
// toolkitProvider.Delegate has a list of callback prototypes to be used as 1st parameters (see members).
//

// facultative. Purpose : to received any API logs. Do whatever you want with them here.
var logCallback = toolkitProvider.Delegate.createCallbackFrom(toolkitProvider.Delegate.CCTaskToolkitLogCallbackDelegate, (timestamp, moduleName, level, versus, func, line, threadId, callstack, msg) => {
	console.log(msg);
});

// facultative.
// Purpose:
// - If true : we connected(control center exists). BUT it DOES NOT mean the connection was accepted => We're still not authenticated, therefore it is useless trying to communicate with CC now.
// - If false : Notify user CC connection was terminated.
var mqttConnectionChangedCallback = toolkitProvider.Delegate.createCallbackFrom(toolkitProvider.Delegate.CCTaskToolkitMQTTConnectionChangedCallback, (connected) => {
	if (connected) {
		console.log('Connected');
	} else {
		console.log('Disconnected');
	}
});


// semi-facultative. We are connected AND authenticated. We can start speaking with CC.
//
// Purpose:
// - It is good practice to push the task catalog now.
// - Warn the user CC connection is legit.
var controlCenterConnectionEstablishedCallback = toolkitProvider.Delegate.createCallbackFrom(toolkitProvider.Delegate.CCTaskToolkitControlCenterConnectionEstablishedCallback, (ccVersion) => {
	console.log('CC ' + ccVersion + ' connection is legit. We authenticated.');
	publishTaskCatalog();
});


// mandatory. CC requests our task catalog (triggered from user manually pressing Refresh Task catalog button).
var refreshTaskCallback = toolkitProvider.Delegate.createCallbackFrom(toolkitProvider.Delegate.CCTaskToolkitRefreshTaskCallback, () => {
	publishTaskCatalog();
});


// facultative. The API gathers variables at fixed intervals to push to CC. Fill them here.
var onVariablesUpdateRefreshCallback = toolkitProvider.Delegate.createCallbackFrom(toolkitProvider.Delegate.CCTaskToolkitOnVariablesUpdateRefreshDelegate, () => {
	publishVariables();
});

// mandatory.
// Each time CC requests the software to execute a task, it will do so through this callback. Arguments are used to identify which task to execute with which parameters.
var taskExecuteReceivedCallback = toolkitProvider.Delegate.createCallbackFrom(toolkitProvider.Delegate.CCTaskToolkitTaskExecuteReceivedCallback, (taskName, taskNameStrLength, jsonTaskParam, jsonTaskParamStrLength, taskuid) => {

	const param = JSON.parse(jsonTaskParam);

	if (taskName == 'PrintTask') {

		if (param.length > 0 && param[0].internalName == 'PrintMessage') {
			console.log(param[0].value);

			let feedback = 'Success';
			toolkitProvider.Logic.SetTaskExecutionFeedback(feedback, feedback.length, '', 0);
			return CCTasktoolkit.CCTaskToolkitTaskExecutionResult.Success;
		}

		let feedback = 'Bad print parameter';
		toolkitProvider.Logic.SetTaskExecutionFeedback(feedback, feedback.length, '', 0);
		return CCTasktoolkit.CCTaskToolkitTaskExecutionResult.Error;

	} else if (taskName == 'Task_Error') {

		let feedback = 'Provoqued error with code ';
		if (param.length > 0 && param[0].internalName == 'TaskErrorArg') {
			feedback += param[0].value;
		} else {
			feedback += 'unknown';
		}
		toolkitProvider.Logic.SetTaskExecutionFeedback(feedback, feedback.length, '', 0);
		return CCTasktoolkit.CCTaskToolkitTaskExecutionResult.Error;
	}

	let feedback = 'Error. Unknown task ';
	toolkitProvider.Logic.SetTaskExecutionFeedback(feedback, feedback.length, '', 0);
	return CCTasktoolkit.CCTaskToolkitTaskExecutionResult.Error;
});

// mandatory. CC needs our IP address we would like to be known from CC (depending of the network interface we chose to use in our application).
//
// For Javascript implementation, prefer using toolkitProvider.Config.SetLocalIP directly to set the local ip interface you'll be using, then returns 0.
var onRequestLocalIpQueryCallback = toolkitProvider.Delegate.createCallbackFrom(toolkitProvider.Delegate.CCTaskToolkitOnRequestLocalIpQuery, (strBuffer, strBufferSize) => {
	
	// For the example, I hard-coded my own ip address
	toolkitProvider.Config.SetLocalIP('10.10.23.201');
	return 0;
});



function installCallbacks() {
	toolkitProvider.Callback.setAPILoggerCallback(logCallback);

	// all task execution requests will trigger this callback, it could be any task from the published catalog
	toolkitProvider.Callback.setTaskExecuteReceivedCallback(taskExecuteReceivedCallback);

	toolkitProvider.Callback.setMQTTConnectionChangedCallback(mqttConnectionChangedCallback);

	toolkitProvider.Callback.setControlCenterConnectionEstablishedCallback(controlCenterConnectionEstablishedCallback);

	toolkitProvider.Callback.setRefreshTaskCallback(refreshTaskCallback);

	toolkitProvider.Callback.setOnVariablesUpdateRefreshCallback(onVariablesUpdateRefreshCallback);

	toolkitProvider.Callback.setOnRequestLocalIpQuery(onRequestLocalIpQueryCallback);
}

function onExit() {
	// When leaving the application.
	// API cleanup. Closes and releases all ressources the low-level API still owns. You must all install again after calling cleanup.
	toolkitProvider.Logic.cleanUpAPI();


	console.log('Low-level API stopped and destroyed.');

	// Don't forget to destroy the callback variables using Delegate.destroyCallback because Javascript ffi engine has limited resources.
	// Since for singlethread Javascript engine (we expected CCTasktoolkit.CCTaskToolkitInitParameters.SingleThreadedCallbacks), callbacks should have been called inside Logic.APIUpdate, then you can destroy callbacks anytime.
	// But be sure the callbacks aren't used anymore.
	toolkitProvider.Delegate.destroyCallback(onRequestLocalIpQueryCallback);
	toolkitProvider.Delegate.destroyCallback(onVariablesUpdateRefreshCallback);
	toolkitProvider.Delegate.destroyCallback(refreshTaskCallback);
	toolkitProvider.Delegate.destroyCallback(controlCenterConnectionEstablishedCallback);
	toolkitProvider.Delegate.destroyCallback(mqttConnectionChangedCallback);
	toolkitProvider.Delegate.destroyCallback(taskExecuteReceivedCallback);
	toolkitProvider.Delegate.destroyCallback(logCallback);



	console.log('Test END');
	process.exit();
}




// Call Logic.installAPI using CCTasktoolkit.CCTaskToolkitInitParameters flags to allocate the API.
//
// IMPORTANT NOTE FOR JAVASCRIPT : you must add CCTasktoolkit.CCTaskToolkitInitParameters.SingleThreadedCallbacks.
toolkitProvider.Logic.installAPI(CCTasktoolkit.CCTaskToolkitInitParameters.CallbackLogger | CCTasktoolkit.CCTaskToolkitInitParameters.SingleThreadedCallbacks);


toolkitProvider.Config.SetSoftwareName('NodeJS', 'NodeJs');

installCallbacks();

// Once pre-start was made, call Logic.initializeAPI to start the API.
toolkitProvider.Logic.initializeAPI();



//setup CC Connection. Can be anywhere between the install and clean up.
setupCCConnection();


mainLoop();

onExit();









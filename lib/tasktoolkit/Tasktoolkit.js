/*
Copyright 2023 Moment Factory Studios Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const koffi = require('koffi');
const process = require('process');
const fs = require('fs');
var path = require('path');



const CCTaskToolkitInitParameters = {
    Minimal: 0,
    CallbackLogger: 0X1 << 0,
    NoShowControl: 0X1 << 1,
    WithPulse: 0X1 << 2,
    SingleThreadedCallbacks: 0X1 << 3,
	CalibrationModule: 0X1 << 4,
	UseCleanupCounter: 0X1 << 5,
};

const CCTaskToolkitLogLevel = {
    Debug: 0,
    Logic: 1,
    Info: 2,
    Warning: 3,
    Error: 4,
    Fatal: 5,
};

const CCTaskToolkitLogVersus = {
    Cout: 0,
    Local: 1,
    Designer: 2,
    Server: 3,
};

const CCTaskToolkitTaskResultType = {
    String: 0
};

const CCTaskToolkitTaskExecutionResult = {
    Success: 0,
    Warning: 1,
    Error: 2,
    DifferAnswer: 3,
};

const CCTaskToolkitTaskDescriptorType = {
    Method: 0
};

const CCTaskToolkitParameterDataType = {
    Bool: 0,
    Float: 1,
    Integer: 2,
    String: 3,
    StringList: 4,
    VariableMultiSelectList: 5,
    VariableList: 6,
    CheckList: 7,
    Color: 8,
};

const PulseVersionCategory = {
    Runtime: 0,
    Component: 1,
    // To help decide on what category is MofaLib
    MofaLib: 1,
};

const PulseMetricsCategory = {
    Role: 0,
    State: 1,
    Subsystem: 2,
    Metrics: 3,
};

const PulseDataType = {
    Double: 0,
    Int64: 1,
    UInt64: 2,
    String: 3,
    Bool: 4,
    Object: 5,
    Table: 6,
    StringView: 7,
    RawJSON: 8,
};

const CCTaskToolkitVariableDataType = {
    Integer: 0,
    Float: 1,
    Bool: 2,
    Enum: 3,
    JSON: 4,
    String: 5,
    Dictionnary: 6,
};

const PulseConnectionMode = {
    MQTT: 0
};

const CalibrationTechnique = {
	Trilateration: 0,
	SphereIntersect: 1,
	HelmertTransform: 2,
	Simple: 3
};


class DelegateClass {
	constructor() {
		this.CCTaskToolkitLogCallbackDelegate = koffi.proto('void CCTaskToolkitLogCallbackDelegate(const char* timestamp, const char* moduleName, int level, int versus, const char* function, int line, const char* threadId, const char* callstack, const char* msg)');
		this.CCTaskToolkitMQTTConnectionChangedCallback = koffi.proto('void CCTaskToolkitMQTTConnectionChangedCallback(bool connected)')

		// CC
		this.CCTaskToolkitControlCenterConnectionEstablishedCallback = koffi.proto('void CCTaskToolkitControlCenterConnectionEstablishedCallback(const char* softwareVersion)')
		this.CCTaskToolkitAdditionalMQTTMessageReceivedQueueCallback = koffi.proto('void CCTaskToolkitAdditionalMQTTMessageReceivedQueueCallback(const char* mqttTopicPrefix, const char* datastoreHost, const char* messageTopic, uint64_t messageTopicStrLength, const char* messagePayload, uint64_t messagePayloadStrLength)')
		this.CCTaskToolkitOnRequestLocalIpQuery = koffi.proto('uint64_t CCTaskToolkitOnRequestLocalIpQuery(char* localIpBuffer, uint64_t bufferAllocatedSize)')
		this.CCTaskToolkitRefreshTaskCallback = koffi.proto('void CCTaskToolkitRefreshTaskCallback()')
		this.CCTaskToolkitTaskExecuteReceivedCallback = koffi.proto('int CCTaskToolkitTaskExecuteReceivedCallback(const char* taskName, uint64_t taskNameStrLength, const char* jsonTaskParam, uint64_t jsonTaskParamStrLength, uint64_t taskExecutionUID)')
		this.CCTaskToolkitOnMqttProjectTopicChangedCallback = koffi.proto('void CCTaskToolkitOnMqttProjectTopicChangedCallback(const char* oldTopicPrefix, const char* newPrefix)')
		this.CCTaskToolkitOnVariablesUpdateRefreshDelegate = koffi.proto('void CCTaskToolkitOnVariablesUpdateRefreshDelegate()')
		this.CCTaskToolkitControlCenterConfigReceivedCallback = koffi.proto('void CCTaskToolkitControlCenterConfigReceivedCallback(const char* rawConfigStr, const char* datastoreHost, const char* brokerHost, const char* projectIdentifier)')
		this.CCTaskToolkitOnPostCommandsProcessDelegate = koffi.proto('void CCTaskToolkitOnPostCommandsProcessDelegate()')

		// Pulse
		this.CCTaskToolkitPulseOnConnectedCallback = koffi.proto('void CCTaskToolkitPulseOnConnectedCallback(bool connected)')
		this.CCTaskToolkitPulseOnPostStartupCallback = koffi.proto('void CCTaskToolkitPulseOnPostStartupCallback(const char* dataSent)')
		this.CCTaskToolkitPulseOnPostHeartbeatCallback = koffi.proto('void CCTaskToolkitPulseOnPostHeartbeatCallback(const char* dataSent)')

		// Calibration
		this.CCTaskToolkitOnCalibrationStartedCallback = koffi.proto('void CCTaskToolkitOnCalibrationStartedCallback()')
		this.CCTaskToolkitOnCalibrationProgressCallback = koffi.proto('void CCTaskToolkitOnCalibrationProgressCallback(float progress, uint64_t elapsedMs)')
		this.CCTaskToolkitOnCalibrationResultCallback = koffi.proto('void CCTaskToolkitOnCalibrationResultCallback(uint32_t referenceToId, uint32_t calibratingId, double tx, double ty, double tz, double rx, double ry, double rz, double rw, double pivotX, double pivotY, double pivotZ)')
		this.CCTaskToolkitOnCalibrationEndedCallback = koffi.proto('void CCTaskToolkitOnCalibrationEndedCallback(bool success, uint64_t elapsedMs, const char* failureReason)')
	}

	createCallbackFrom(delegate, cb) {
		return koffi.register(cb, koffi.pointer(delegate));
	}

	destroyCallback(cb) {
		koffi.unregister(cb);
	}
};

class LogicClass {
	constructor(handle) {
		this.installAPI = handle.func('const char* installCCTaskToolkitAPI(int settings)');
		this.initializeAPI = handle.func('bool initializeCCTaskToolkitAPI()');
		this.cleanUpAPI = handle.func('bool cleanUpCCTaskToolkitAPI()');
		this.APIUpdate = handle.func('bool CCTaskToolkitAPIUpdate()');

		// CC
		this.SetTaskExecutionFeedback = handle.func('bool CCTaskToolkitSetTaskExecutionFeedback(const char* executionFeedback, uint64_t executionFeedbackStrLength, const char* jsonDataStr, uint64_t jsonDataStrLength)');
		this.NotifyAsyncTaskExecutionResult = handle.func('bool CCTaskToolkitNotifyAsyncTaskExecutionResult(uint64_t asyncTaskUID, int result, const char* executionFeedback, uint64_t executionFeedbackStrLength, const char* jsonDataStr, uint64_t jsonDataStrLength)');
	}
};

class CallbackClass {
	constructor(handle) {
		this.setAPILoggerCallback = handle.func('bool setCCTaskToolkitAPILoggerCallback(CCTaskToolkitLogCallbackDelegate* cb)');
		this.setMQTTConnectionChangedCallback = handle.func('bool setCCTaskToolkitMQTTConnectionChangedCallback(CCTaskToolkitMQTTConnectionChangedCallback* cb)');
		this.setControlCenterConnectionEstablishedCallback = handle.func('bool setCCTaskToolkitControlCenterConnectionEstablishedCallback(CCTaskToolkitControlCenterConnectionEstablishedCallback* cb)');
		this.setAdditionalMQTTMessageReceivedQueueCallback = handle.func('bool setCCTaskToolkitAdditionalMQTTMessageReceivedQueueCallback(CCTaskToolkitAdditionalMQTTMessageReceivedQueueCallback* cb)');
		this.setRefreshTaskCallback = handle.func('bool setCCTaskToolkitRefreshTaskCallback(CCTaskToolkitRefreshTaskCallback* cb)');
		this.setOnRequestLocalIpQuery = handle.func('bool setCCTaskToolkitOnRequestLocalIpQuery(CCTaskToolkitOnRequestLocalIpQuery* cb)');
		this.setTaskExecuteReceivedCallback = handle.func('bool setCCTaskToolkitTaskExecuteReceivedCallback(CCTaskToolkitTaskExecuteReceivedCallback* cb)');
		this.setOnMqttProjectTopicChangedCallback = handle.func('bool setCCTaskToolkitOnMqttProjectTopicChangedCallback(CCTaskToolkitOnMqttProjectTopicChangedCallback* cb)');
		this.setOnVariablesUpdateRefreshCallback = handle.func('bool setCCTaskToolkitOnVariablesUpdateRefreshCallback(CCTaskToolkitOnVariablesUpdateRefreshDelegate* cb)');
		this.setControlCenterConfigReceivedCallback = handle.func('bool setCCTaskToolkitControlCenterConfigReceivedCallback(CCTaskToolkitControlCenterConfigReceivedCallback* cb)');
		this.setOnPostCommandsProcessCallback = handle.func('bool setCCTaskToolkitOnPostCommandsProcessCallback(CCTaskToolkitOnPostCommandsProcessDelegate* cb)');
	}
};

class ConfigClass {
	constructor(handle) {
		this.SetDatastoreHost = handle.func('bool CCTaskToolkitSetDatastoreHost(const char* host, bool connectNow)');
		this.SetMqttBrokerHost = handle.func('bool CCTaskToolkitSetMqttBrokerHost(const char* host, bool connectNow)');
		this.SetCatalogName = handle.func('bool CCTaskToolkitSetCatalogName(const char* catalogName)');
		this.SetProjectIdentifier = handle.func('bool CCTaskToolkitSetProjectIdentifier(const char* topicPrefix)');
		this.SetSoftwareName = handle.func('bool CCTaskToolkitSetSoftwareName(const char* internalName, const char* displayName)');
		this.SetLocalIP = handle.func('bool CCTaskToolkitSetLocalIP(const char* localIp)');
		this.SetIgnoreAllCCMessages = handle.func('bool CCTaskToolkitSetIgnoreAllCCMessages(bool ignoreAll)');
		this.SetShouldLogCallstack = handle.func('bool CCTaskToolkitSetShouldLogCallstack(bool enable)');
		this.EnablePrettyJsonMode = handle.func('bool CCTaskToolkitEnablePrettyJsonMode(bool enable)');
		this.SetShouldLogManualTaskExecution = handle.func('bool CCTaskToolkitSetShouldLogManualTaskExecution(bool enable)');
		this.EnableEnableExtraLogVerbosity = handle.func('bool CCTaskToolkitEnableEnableExtraLogVerbosity(bool enable)');
	}
};

class PublishClass {
	constructor(handle) {
		// Catalog
		this.BeginCatalog = handle.func('bool CCTaskToolkitBeginCatalog(uint64_t expectedTaskCount)');
		this.EndCatalog = handle.func('bool CCTaskToolkitEndCatalog(bool publishNow)');
		this.SetCatalogDescription = handle.func('bool CCTaskToolkitSetCatalogDescription(const char* description)');

		// Variables
		this.CreateVariable = handle.func('bool CCTaskToolkitCreateVariable(const char* overridingJson)');
		this.SetVariablePath = handle.func('bool CCTaskToolkitSetVariablePath(const char* variablePath)');
		this.SetVariableKeepHistory = handle.func('bool CCTaskToolkitSetVariableKeepHistory(bool keepHistory)');
		this.AddVariableTag = handle.func('bool CCTaskToolkitAddVariableTag(const char* newTag)');

		// Status task polling rules
		this.CreateStatusTaskPollingRule = handle.func('bool CCTaskToolkitCreateStatusTaskPollingRule(const char* overridingJson)');
		this.SetStatusTaskPollingRuleRunOnce = handle.func('bool CCTaskToolkitSetStatusTaskPollingRuleRunOnce(bool runOnce)');
		this.SetStatusTaskPollingRuleRunOnceBeforeInterval = handle.func('bool CCTaskToolkitSetStatusTaskPollingRuleRunOnceBeforeInterval(bool runOnceBeforeInterval)');
		this.SetStatusTaskPollingRuleEnabled = handle.func('bool CCTaskToolkitSetStatusTaskPollingRuleEnabled(bool enabled)');
		this.SetStatusTaskPollingRuleIntervalMs = handle.func('bool CCTaskToolkitSetStatusTaskPollingRuleIntervalMs(int pollingMilliseconds)');

		// Tasks Groups
		this.CreateTaskGroup = handle.func('bool CCTaskToolkitCreateTaskGroup(const char* guid, const char* displayName)');

		// Tasks
		this.CreateActionTask = handle.func('bool CCTaskToolkitCreateActionTask(const char* internalName, const char* displayName, const char* description, int timeoutDurationMs)');
		this.CreateStatusTask = handle.func('bool CCTaskToolkitCreateStatusTask(const char* guid, const char* displayName, const char* description, int timeoutDurationMs)');
		this.SetTaskDescriptorType = handle.func('bool CCTaskToolkitSetTaskDescriptorType(int descriptor)');
		this.SetTaskResultType = handle.func('bool CCTaskToolkitSetTaskResultType(int resultType)');
		this.SetTaskReplyRequired = handle.func('bool CCTaskToolkitSetTaskReplyRequired(bool required)');
		this.SetTaskIsGeneric = handle.func('bool CCTaskToolkitSetTaskIsGeneric(bool isGeneric)');
		this.SetTaskIcon = handle.func('bool CCTaskToolkitSetTaskIcon(const char* iconName)');

		// Parameters
		this.CreateParameterFromString = handle.func('bool CCTaskToolkitCreateParameterFromString(const char* identifier, const char* displayName, const char* description, const char* typeStr, bool required)');
		this.CreateParameter = handle.func('bool CCTaskToolkitCreateParameter(const char* identifier, const char* displayName, const char* description, int type, bool required)');
		this.SetParameterDefaultValue = handle.func('bool CCTaskToolkitSetParameterDefaultValue(const char* defaultValue)');
		this.SetParameterCandidates = handle.func('bool CCTaskToolkitSetParameterCandidates(const char* commaSeparatedCandidates)');
		this.SetParameterCandidatesSourceVariableInternalName = handle.func('bool CCTaskToolkitSetParameterCandidatesSourceVariableInternalName(const char* candidatesSourceVariableInternalName)');

		// Variables in Datastore
		this.BeginVariable = handle.func('bool CCTaskToolkitBeginVariable(const char* variableName, int type, bool isUserVariable)');
		this.EndDatastoreVariable = handle.func('bool CCTaskToolkitEndDatastoreVariable(bool publishNow)');
		this.SetDatastoreBoolVariableValue = handle.func('bool CCTaskToolkitSetDatastoreBoolVariableValue(bool value)');
		this.SetDatastoreIntVariableValue = handle.func('bool CCTaskToolkitSetDatastoreIntVariableValue(int value)');
		this.SetDatastoreFloatVariableValue = handle.func('bool CCTaskToolkitSetDatastoreFloatVariableValue(double value)');
		this.SetDatastoreStringVariableValue = handle.func('bool CCTaskToolkitSetDatastoreStringVariableValue(const char* value)');
		this.SetDatastoreJSONVariableValue = handle.func('bool CCTaskToolkitSetDatastoreJSONVariableValue(const char* value)');
		this.SetDatastoreEnumVariableValue = handle.func('bool CCTaskToolkitSetDatastoreEnumVariableValue(int value)');
		this.AddDatastoreEnumVariableMapping = handle.func('bool CCTaskToolkitAddDatastoreEnumVariableMapping(const char* mappingIdentifier, int value, const char* graphanaColor)');
		this.AddDictionnaryMapping = handle.func('bool CCTaskToolkitAddDictionnaryMapping(const char* key, int value)');
		this.AddDatastoreDictionnaryGenericMapping = handle.func('bool CCTaskToolkitAddDatastoreDictionnaryGenericMapping(const char* key, int valueType, const char* value)');
		this.AddDatastoreDictionnaryIntMapping = handle.func('bool CCTaskToolkitAddDatastoreDictionnaryIntMapping(const char* key, int value)');
		this.AddDatastoreDictionnaryFloatMapping = handle.func('bool CCTaskToolkitAddDatastoreDictionnaryFloatMapping(const char* key, double value)');
		this.AddDatastoreDictionnaryBoolMapping = handle.func('bool CCTaskToolkitAddDatastoreDictionnaryBoolMapping(const char* key, bool value)');
		this.AddDatastoreDictionnaryStringMapping = handle.func('bool CCTaskToolkitAddDatastoreDictionnaryStringMapping(const char* key, const char* value)');
		this.AddDatastoreDictionnaryJSONMapping = handle.func('bool CCTaskToolkitAddDatastoreDictionnaryJSONMapping(const char* key, const char* json)');
		this.SetDatastoreVariableUpdateValueInDatabase = handle.func('bool CCTaskToolkitSetDatastoreVariableUpdateValueInDatabase(bool update)');
		this.AddDatastoreVariableTag = handle.func('bool CCTaskToolkitAddDatastoreVariableTag(const char* tag)');

		// Error reporting
		this.PublisherErrorCount = handle.func('uint64_t CCTaskToolkitPublisherErrorCount()');
		this.PublisherGetCurrentError = handle.func('const char* CCTaskToolkitPublisherGetCurrentError()');
		this.PublisherNextError = handle.func('bool CCTaskToolkitPublisherNextError()');
		this.PublisherClearErrors = handle.func('void CCTaskToolkitPublisherClearErrors()');

		// Publication Control
		this.PublisherClear = handle.func('void CCTaskToolkitPublisherClear()');
		this.PublishCatalog = handle.func('bool CCTaskToolkitPublishCatalog(const char* catalogName)');
	}
};

class UtilityClass {
	constructor(handle) {
		this.ParameterIsOfType = handle.func('bool CCTaskToolkitParameterIsOfType(const char* typeStr, const int* paramsToCheck, uint64_t paramsToCheckSz)');
		this.ParseParameterType = handle.func('int CCTaskToolkitParseParameterType(const char* typeStr)');
		this.MakeVersion = handle.func('uint64_t CCTaskToolkitMakeVersion(uint16_t major, uint16_t minor, uint16_t subminor)');
		this.GetVersion = handle.func('uint64_t CCTaskToolkitGetVersion()');
		this.GetVersionString = handle.func('const char* CCTaskToolkitGetVersionString()');
	}
};

class PulseClass {
	constructor(handle) {
		// Control
		this.SetupPulseID = handle.func('bool CCTaskToolkitPulseSetupPulseID(const char* mfProjectCode, const char* zone, const char* capsuleOrGoal, const char* instanceID)');
		this.SetAPIVersion = handle.func('bool CCTaskToolkitPulseSetAPIVersion(int versionToUse)');
		this.SetupConnectionSettings = handle.func('bool CCTaskToolkitPulseSetupConnectionSettings(const char* address, int mode)');
		this.SetupConnectionLogin = handle.func('bool CCTaskToolkitPulseSetupConnectionLogin(const char* username, const char* password)');
		this.SetPulseOfflineEnabled = handle.func('bool CCTaskToolkitPulseSetEnabledOffline(bool pulseOfflineEnable)');
		this.SetPulseWindowMetricsEnabled = handle.func('bool CCTaskToolkitPulseSetPulseWindowMetricsEnabled(bool enableWindowMetrics)');
		this.WatchAPIUpdate = handle.func('bool CCTaskToolkitPulseWatchAPIUpdate(int64_t watchTimeoutMs)');
		this.SetHeartbeatInterval = handle.func('bool CCTaskToolkitPulseSetHeartbeatInterval(double heartbeatTimeStepSeconds, double pulseThreadRefreshTimeStepSeconds)');
		this.NotifyExitCause = handle.func('bool CCTaskToolkitPulseNotifyExitCause(const char* exitCause, bool sendExit)');
		this.AllowSetupExceptionHandlers = handle.func('bool CCTaskToolkitPulseAllowSetupExceptionHandlers(bool allowSignalMonitoring, bool allowAtExitHandlers)');
		this.DeclareVersionModule = handle.func('bool CCTaskToolkitPulseDeclareVersionModule(int category, const char* moduleName, const char* moduleVersion)');
		this.NotifyNewFrame = handle.func('bool CCTaskToolkitPulseNotifyNewFrame(double fpsAverageOverride, uint64_t frameDrop)');
		this.NotifyNewFrameWithTotalFrame = handle.func('bool CCTaskToolkitPulseNotifyNewFrameWithTotalFrame(double fpsAverageOverride, uint64_t frameDrop, uint64_t totalFrames)');

		// Metrics
		this.CustomMetricPusherHandle = koffi.opaque('CustomMetricPusherHandle');
		this.AddNewCustomMetricsPusher = handle.func('CustomMetricPusherHandle* CCTaskToolkitPulseAddNewCustomMetricsPusher(const char* pusherName, int category, int timeoutSeconds)');
		this.SetExternalMetricsMaxStackSize = handle.func('bool CCTaskToolkitPulseSetExternalMetricsMaxStackSize(CustomMetricPusherHandle* pusherHandle, uint16_t newMaxStackSize)');
		this.ExternalMetricsSetIntValue = handle.func('bool CCTaskToolkitPulseExternalMetricsSetIntValue(CustomMetricPusherHandle* pusherHandle, const char* keyName, int64_t value)');
		this.ExternalMetricsSetUIntValue = handle.func('bool CCTaskToolkitPulseExternalMetricsSetUIntValue(CustomMetricPusherHandle* pusherHandle, const char* keyName, uint64_t value)');
		this.ExternalMetricsSetDoubleValue = handle.func('bool CCTaskToolkitPulseExternalMetricsSetDoubleValue(CustomMetricPusherHandle* pusherHandle, const char* keyName, double value)');
		this.ExternalMetricsSetBoolValue = handle.func('bool CCTaskToolkitPulseExternalMetricsSetBoolValue(CustomMetricPusherHandle* pusherHandle, const char* keyName, bool value)');
		this.ExternalMetricsSetStringValue = handle.func('bool CCTaskToolkitPulseExternalMetricsSetStringValue(CustomMetricPusherHandle* pusherHandle, const char* keyName, const char* value)');
		this.ExternalMetricsSetJSONValue = handle.func('bool CCTaskToolkitPulseExternalMetricsSetJSONValue(CustomMetricPusherHandle* pusherHandle, const char* keyName, const char* rawJsonContent)');
		this.ExternalMetricsBeginObject = handle.func('bool CCTaskToolkitPulseExternalMetricsBeginObject(CustomMetricPusherHandle* pusherHandle, const char* keyName)');
		this.ExternalMetricsBeginTable = handle.func('bool CCTaskToolkitPulseExternalMetricsBeginTable(CustomMetricPusherHandle* pusherHandle, const char* keyName)');
		this.ExternalMetricsEndStack = handle.func('bool CCTaskToolkitPulseExternalMetricsEndStack(CustomMetricPusherHandle* pusherHandle)');
		this.RemoveExternalMetrics = handle.func('bool CCTaskToolkitPulseRemoveExternalMetrics(CustomMetricPusherHandle* pusherHandleToRemove)');

		// Callbacks
		this.setOnConnectedCallback = handle.func('bool CCTaskToolkitPulseSetOnConnectedCallback(CCTaskToolkitPulseOnConnectedCallback* cb)');
		this.setOnPostStartupCallback = handle.func('bool setCCTaskToolkitPulseOnPostStartupCallback(CCTaskToolkitPulseOnPostStartupCallback* cb)');
		this.setOnPostHeartbeatCallback = handle.func('bool setCCTaskToolkitPulseOnPostHeartbeatCallback(CCTaskToolkitPulseOnPostHeartbeatCallback* cb)');
	}
};

class CalibrationClass {
	constructor(handle) {
		// Config
		this.SetCalibrationTechnique = handle.func('bool CCTaskToolkitSetCalibrationTechnique(int technique)');

		// Logic
		this.Clear = handle.func('bool CCTaskToolkitClearCalibration()');
		this.SetDevicesID = handle.func('bool CCTaskToolkitCalibrationSetDevicesID(uint32_t referenceID, uint32_t calibratingID)');
		this.AddCalibrationPoints = handle.func('bool CCTaskToolkitAddCalibrationPoints(double refToPosX, double refToPosY, double refToPosZ, double calFromPosX, double calFromPosY, double calFromPosZ)');
		this.Execute = handle.func('bool CCTaskToolkitCalibrationExecute()');

		// Callbacks
		this.setCCTaskToolkitOnCalibrationStartedCallback = handle.func('bool setCCTaskToolkitOnCalibrationStartedCallback(CCTaskToolkitOnCalibrationStartedCallback* cb)');
		this.setOnCalibrationResultCallback = handle.func('bool setCCTaskToolkitOnCalibrationResultCallback(CCTaskToolkitOnCalibrationResultCallback* cb)');
		this.setOnCalibrationEndedCallback = handle.func('bool setCCTaskToolkitOnCalibrationEndedCallback(CCTaskToolkitOnCalibrationEndedCallback* cb)');
	}
};

class CCTasktoolkitProvider {
    constructor(cctasktoolkitDllPath = "") {
		if (cctasktoolkitDllPath == "") {
			cctasktoolkitDllPath = CCTasktoolkitProvider.#computeDllPathInModule("cc-tasktoolkit");
		}
		
		if (!fs.existsSync(cctasktoolkitDllPath)) {
			throw new Error('Tasktoolkit module cannot load dynamic library ' + cctasktoolkitDllPath + ' because it doesn\'t exist.');
		}
		
		const jukeboxContainingWorkingDir = path.dirname(cctasktoolkitDllPath);
		const oldWorkingDir = CCTasktoolkitProvider.#setWorkingDirToPath(jukeboxContainingWorkingDir);
		
		try {
			this.cctasktoolkitHandle = CCTasktoolkitProvider.#loadDynamicLibrary(cctasktoolkitDllPath);

			this.Delegate = new DelegateClass();

			this.Callback = new CallbackClass(this.cctasktoolkitHandle);
			this.Logic = new LogicClass(this.cctasktoolkitHandle);
			this.Config = new ConfigClass(this.cctasktoolkitHandle);
			this.Publish = new PublishClass(this.cctasktoolkitHandle);
			this.Utility = new UtilityClass(this.cctasktoolkitHandle);
			this.Pulse = new PulseClass(this.cctasktoolkitHandle);
			this.Calibration = new CalibrationClass(this.cctasktoolkitHandle);
			
		} finally {
			CCTasktoolkitProvider.#setWorkingDirToPath(oldWorkingDir);
		}
	}
	
	static #loadDynamicLibrary(libPath) {
		if (!fs.existsSync(libPath)) {
			throw new Error('Tasktoolkit module cannot load dynamic library ' + libPath + ' because it doesn\'t exist.');
		}
		
		console.log("Loading dynamic library " + libPath)
		
		return koffi.load(libPath);
	}

	static #computeDistribution() {
		try {
			const data = fs.readFileSync('/etc/os-release', 'utf8');
			
			const lines = data.split('\n');
				const releaseDetails = {};
				lines.forEach((line, index) => {
					// Split the line into an array of words delimited by '='
					const words = line.split('=');
					if (words.length > 1) {
						releaseDetails[words[0].trim().toLowerCase()] = words[1].trim();
					}
				});

				const distributionResult = releaseDetails.id;
				if (distributionResult.length > 0) {
					return distributionResult.charAt(0).toUpperCase() + distributionResult.slice(1);
				}
				
		} catch (error) { }
		
		return "Ubuntu";
	}
	
	static #computeNameDllInModule(baseName) {
		let platform = process.platform;
		switch(platform) {
			case 'win32': return baseName + ".dll";
			case 'linux': return "lib" + baseName + ".so";
			
			default: throw new Error('Tasktoolkit doesn\'t provide a dynamic library for platform ' + platform + '.');
		}
	}
	
	static #computeDllPathInModule(libName) {
		const platform = process.platform;
		const dynamicLibFileName = CCTasktoolkitProvider.#computeNameDllInModule(libName);
		let dynamicLibFilePath = '';
		
		switch(platform) {
			case 'win32':
				dynamicLibFilePath = path.join("Windows", dynamicLibFileName);
				break;
			
			case 'linux':
				const architecture = process.arch;
				const distribution = CCTasktoolkitProvider.#computeDistribution();
				dynamicLibFilePath = path.join(distribution, architecture, dynamicLibFileName);
				break;
			
			default:
		}
		
		if (dynamicLibFilePath == '') {
			throw new Error('Tasktoolkit doesn\'t provide a dynamic library for platform ' + platform + '.');
		}
		
		return path.join(module.path, "bin", dynamicLibFilePath);
	}
	
	static #setWorkingDirToPath(dir) {
		let oldPath = process.cwd();
		process.chdir(dir);
		return oldPath;
	}
};



module.exports.CCTaskToolkitInitParameters = CCTaskToolkitInitParameters;
module.exports.CCTaskToolkitLogLevel = CCTaskToolkitLogLevel;
module.exports.CCTaskToolkitLogVersus = CCTaskToolkitLogVersus;
module.exports.CCTaskToolkitTaskResultType = CCTaskToolkitTaskResultType;
module.exports.CCTaskToolkitTaskExecutionResult = CCTaskToolkitTaskExecutionResult;
module.exports.CCTaskToolkitTaskDescriptorType = CCTaskToolkitTaskDescriptorType;
module.exports.CCTaskToolkitParameterDataType = CCTaskToolkitParameterDataType;
module.exports.PulseVersionCategory = PulseVersionCategory;
module.exports.PulseMetricsCategory = PulseMetricsCategory;
module.exports.PulseDataType = PulseDataType;
module.exports.CCTaskToolkitVariableDataType = CCTaskToolkitVariableDataType;
module.exports.PulseConnectionMode = PulseConnectionMode;
module.exports.DelegateClass = DelegateClass;
module.exports.LogicClass = LogicClass;
module.exports.CallbackClass = CallbackClass;
module.exports.ConfigClass = ConfigClass;
module.exports.PublishClass = PublishClass;
module.exports.UtilityClass = UtilityClass;
module.exports.PulseClass = PulseClass;
module.exports.CalibrationClass = CalibrationClass;
module.exports.CCTasktoolkitProvider = CCTasktoolkitProvider;

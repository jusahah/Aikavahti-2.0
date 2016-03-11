var _ = require('lodash');

module.exports = function(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree, signalsArray) {


	var signalsTable = {};

	_.each(signalsArray, function(signal) {
		signalsTable[signal.id] = signal;
	});

	return signalsTable;
}

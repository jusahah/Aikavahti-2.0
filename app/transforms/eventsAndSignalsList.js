var _ = require('lodash');

module.exports = function(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree, signalsArray, sortedEventsAndSignals) {

	// Arguments should not be modified!!

	// Note that does not contain children property

	var signalsTable = {};

	_.each(signalsArray, function(signal) {
		signalsTable[signal.id] = signal;
	});

	console.error("Transformer running: eventsAndSignalsList");

	var eventsWithSchemaInfo = _.map(sortedEventsAndSignals, function(event) {
		var e2 = Object.assign({}, event);
		if (!event.signal) {
			if (normalizedSchemaTable.hasOwnProperty(event.s)) {
				Object.assign(e2, normalizedSchemaTable[event.s]);
				// Delete children property
				delete e2.children;
			}
		} else {
			if (signalsTable.hasOwnProperty(event.s)) {
				Object.assign(e2, signalsTable[event.s]);
				// Delete children property
				delete e2.children;
			}
		}
		return e2;
	});

	return eventsWithSchemaInfo;

}
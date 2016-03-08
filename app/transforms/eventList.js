var _ = require('lodash');

module.exports = function(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree) {

	// Arguments should not be modified!!

	// Note that does not contain children property

	console.error("Transformer running: eventList");

	var eventsWithSchemaInfo = _.map(sortedEvents, function(event) {
		var e2 = Object.assign({}, event);
		if (normalizedSchemaTable.hasOwnProperty(event.s)) {
			Object.assign(e2, normalizedSchemaTable[event.s]);
			// Delete children property
			delete e2.children;
		}
		return e2;
	});

	return eventsWithSchemaInfo;

}

var _ = require('lodash');

module.exports = function(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree) {
	console.error("normalizedSchemaTable returning");
	console.log(JSON.stringify(normalizedSchemaTable));
	return normalizedSchemaTable; // Oh so simple
}
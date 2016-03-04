var _ = require('lodash');

module.exports = function(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree) {

	// Arguments should not be modified!!

	console.error("Transformer running: frontViewData");
	console.log("DATA RECEIVED IN TRANSFORMER");
	console.log(JSON.stringify(sortedEvents));
	console.log(JSON.stringify(dayChangesAdded));
	console.log(JSON.stringify(sortedDurations));
	console.log(JSON.stringify(schemaTree));
	console.log(normalizedSchemaTable);
	console.log(JSON.stringify(settingsTree));



	return 0;
	

}
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

	var frontView = {};

	// Current
	var currentEvent = sortedEvents[0];
	var currentSchemaItemCopy = getCopyOfSchemaItem(currentEvent.s, normalizedSchemaTable);

	currentSchemaItemCopy.start = currentEvent.t;
	frontView.current = currentSchemaItemCopy;

	// Last ten
	frontView.lastTen = [];
	var limit = 10;
	for (var i = 0, j = sortedDurations.length; i < j; i++) {
		if (i >= limit) break;
		var e = sortedDurations[i];
		console.log("E");
		console.log(e);
		var current = getCopyOfSchemaItem(e.s, normalizedSchemaTable);
		current.start = e.start;
		current.end   = e.end;

		frontView.lastTen.push(current);
	};

	// Change activity buttons data
	frontView.schemaItems = schemaTreeToArray(schemaTree, false);
	frontView.schemaLeaves = schemaTreeToArray(schemaTree, true);


	return frontView;
	

}

function getCopyOfSchemaItem(id, normalizedSchemaTable) {
	return Object.assign({}, normalizedSchemaTable[id]);
}

function schemaTreeToArray(schemaTree, onlyLeaf) {
	var copies = [];

	var copyTraverse = function(branch) {
		if (branch.hasOwnProperty('children') && branch.children && branch.children.length > 0) {
			if (!onlyLeaf) {
				copies.push(copySchemaItem(branch));
			}
			_.each(branch.children, copyTraverse);
		} else {
			// Leaf
			copies.push(copySchemaItem(branch));
		}
	}

	_.each(schemaTree, copyTraverse);

	return copies;


}

function copySchemaItem(item) {
	// All the others but children
	var copyO = {};

	_.forOwn(item, function(value, key) {
		if (key !== 'children') {
			copyO[key] = value;
		}
	});

	return copyO;
}
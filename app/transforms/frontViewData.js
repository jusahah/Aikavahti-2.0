var _ = require('lodash');

module.exports = function(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree, signalsArray) {

	// Arguments should not be modified!!

	console.error("Transformer running: frontViewData");
	console.log("DATA RECEIVED IN TRANSFORMER");
	console.warn("RAW EVENTS SORTED");
	console.log(JSON.stringify(sortedEvents));
	console.warn("DAY CHANGES ADDED");
	console.log(JSON.stringify(dayChangesAdded));
	console.warn("DURATIONS");
	console.log(JSON.stringify(sortedDurations));
	console.log(JSON.stringify(schemaTree));
	console.log(normalizedSchemaTable);
	console.log(JSON.stringify(settingsTree));

	var frontView = {};

	// Current
	var currentEvent = sortedEvents[0];
	var currentSchemaItemCopy;
	if (!currentEvent) {
		currentSchemaItemCopy = {
			start: Date.now(),
			notes: 'Tervetuloa Aikavahti-ohjelman pariin!',
			name: '(poissa)',
			id: 0,
			color: '554455'
		};
	} else {
		if (parseInt(currentEvent.s) === 0) {
			currentSchemaItemCopy = {id: 0, name: '(poissa)', color: '554455'};
		}
		else {
			currentSchemaItemCopy = getCopyOfSchemaItem(currentEvent.s, normalizedSchemaTable);
		}
		
		currentSchemaItemCopy.start = currentEvent.t;
		currentSchemaItemCopy.notes = currentEvent.notes;
	}


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
		current.notes = e.notes;

		frontView.lastTen.push(current);
	};

	// Change activity buttons data
	frontView.schemaItems = schemaTreeToArray(schemaTree, false);
	frontView.schemaLeaves = schemaTreeToArray(schemaTree, true);
	frontView.signalsArray = signalsArray;

	if (frontView.lastTen.length > 0) {
		frontView.lastTen.shift(); // drop the first as we dont want it
	}


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
var _ = require('lodash');
var moment = require('moment');


module.exports = function(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree, signalsArr, sortedSignalsAndEvents) {

	var tagsToEventsTable = {}; // tag string -> array of event timestamps
	var eventList = eventListCreation(sortedEvents, normalizedSchemaTable);

	_.each(eventList, function(event) {
		if (event.hasOwnProperty('notes')) {
			var tagsFound = resolveTags(event.notes);
			_.each(tagsFound, function(tag) {
				if (!tagsToEventsTable.hasOwnProperty(tag)) {
					tagsToEventsTable[tag] = [];
				}

				tagsToEventsTable[tag].push({
					color: event.color,
					t: event.t,
					notes: event.notes,
					name: event.name
				});

			});
		}

	});

	return tagsToEventsTable;


}


function resolveTags(notes) {

	var words = notes.split(' ');

	return _.filter(words, function(word) {
		return word.charAt(0) === '#' && word.length > 1; // Check it has # and that its not only letter
	});
}

function eventListCreation(sortedEvents, normalizedSchemaTable) {
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


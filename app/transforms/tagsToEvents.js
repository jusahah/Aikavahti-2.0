var _ = require('lodash');
var moment = require('moment');


module.exports = function(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree, signalsArr, sortedSignalsAndEvents) {

	var tagsToEventsTable = {}; // tag string -> array of event timestamps

	_.each(sortedEvents, function(event) {
		if (event.hasOwnProperty('notes')) {
			var tagsFound = resolveTags(event.notes);
			_.each(tagsFound, function(tag) {
				if (!tagsToEventsTable.hasOwnProperty(tag)) {
					tagsToEventsTable[tag] = [];
				}

				tagsToEventsTable[tag].push(event.t);

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


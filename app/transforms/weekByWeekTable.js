var _ = require('lodash');
var moment = require('moment');

var dayByDayPerSchemaId = require('./dayByDayPerSchemaId');


module.exports = function(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree, signalsArr, sortedSignalsAndEvents) {
	if (sortedEvents.length === 0) return {};

	// Lets reuse earlier transform
	// Note that this leads dayByday-stuff being needlessly computed twice!
	// So perhaps optimize later by caching it somehow 

	var dayByDayResults = dayByDayPerSchemaId(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree, signalsArr, sortedSignalsAndEvents);

	var weeksToDurations = {};

	_.forOwn(dayByDayResults, function(schemaIDsToDurations, datestring) {
		var weekString = getWeekString(datestring);
		if (!weeksToDurations.hasOwnProperty(weekString)) {
			weeksToDurations[weekString] = {};
		}

		var weekObj = weeksToDurations[weekString];

		_.forOwn(dayByDayResults[datestring], function(duration, schemaID) {
			if (!weekObj.hasOwnProperty(schemaID)) {
				weekObj[schemaID] = 0;
			}

			weekObj[schemaID] += duration;
		});
	});
	console.warn("WEEKS TO DURATIONS");
	console.log(JSON.stringify(weeksToDurations));

	//return makeItSortedArray(weeksToDurations);
	return weeksToDurations;

}


function getWeekString(datestring) {

	// datestring = DD.MM.YYYY
	console.log("DATE STRING IN GETWEEKSTRING: " + datestring);

	var m = moment(datestring, 'DD.MM.YYYY');
	console.log("WEEK STRING IS: " + m.isoWeekYear() + "-" + m.isoWeeks());
	return m.isoWeekYear() + "-" + m.isoWeeks();
}

function makeItSortedArray(weeksTable) {
	var arr = [];
	_.forOwn(weeksTable, function(weekObj, weekString) {
		arr.push({weekString: weekString, obj: weekObj});
	});

	return _.sortBy(arr, function(obj) {
		return obj.weekString;
	})
}
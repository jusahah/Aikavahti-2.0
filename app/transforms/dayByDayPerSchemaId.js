var _ = require('lodash');
var moment = require('moment');


module.exports = function(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree) {

	var addToCumulative = function(ds, schemaID, totalTime, cumulativeTable) {
			if (!cumulativeTable.hasOwnProperty(ds)) {
				cumulativeTable[ds] = {};
			}

			if (!cumulativeTable[ds].hasOwnProperty(schemaID)) {
				cumulativeTable[ds][schemaID] = 0;
			}

			cumulativeTable[ds][schemaID] += totalTime;		
	}

	var dateToCumulativeTimePerSchemaId = {};

	_.each(sortedDurations, function(duration) {
		if (parseInt(duration.s) === 0) return;
		var timeChangeTimestamp = getDayChangeTimestamp(duration.start, duration.end);
		if (timeChangeTimestamp === 0) {
			var ds = getDateString(duration.start);
			addToCumulative(ds, duration.s, duration.d, dateToCumulativeTimePerSchemaId);
		} else {
			var firstDayDuration = timeChangeTimestamp - duration.start;
			var secondDayDuration = duration.end - timeChangeTimestamp;
			var firstDayString = getDateString(duration.start);
			var secondDayString = getDateString(duration.end);

			addToCumulative(firstDayString, duration.s, firstDayDuration, dateToCumulativeTimePerSchemaId);
			addToCumulative(secondDayString, duration.s, secondDayDuration, dateToCumulativeTimePerSchemaId);

		}

	});


	return dateToCumulativeTimePerSchemaId;


}

function getDateString(timestamp) {
	return moment(timestamp).format('DD-MM-YYYY');
}

function getDayChangeTimestamp(start, end) {
	var d = new Date(end);
	var startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

	if (startOfDay > start) {
		return startOfDay;
	}

	return 0;



}
/*
function inSameDay(start, end) {
	var d1 = new Date(start);
	var d2 = new Date(end);

	return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth();
}
*/
var _ = require('lodash');
var moment = require('moment');

var dayByDayPerSignalId = require('./dayByDayCountPerSignalId');


module.exports = function(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree, signalsArr, sortedSignalsAndEvents) {
	
	var signalsCountPerDate = dayByDayPerSignalId(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree, signalsArr, sortedSignalsAndEvents);
	// date(DD-MM-YYYY) -> signalID -> int

	var signalCounts = {
		month: {},
		week: {}
	};
	var weekHolder = signalCounts.week;
	var monthHolder = signalCounts.month;
	

	_.forOwn(signalsCountPerDate, function(counts, dateString) {
		var month = getMonthString(dateString);
		var week  = getWeekString(dateString);



		if (!weekHolder.hasOwnProperty(week)) {
			weekHolder[week] = {};
		}

		if (!monthHolder.hasOwnProperty(month)) {
			monthHolder[month] = {};
		}

		var monthObj = monthHolder[month];
		var weekObj = weekHolder[week];

		_.forOwn(counts, function(count, signalID) {
			if (!monthObj.hasOwnProperty(signalID)) {
				monthObj[signalID] = 0;
			}	

			monthObj[signalID] += count;

			if (!weekObj.hasOwnProperty(signalID)) {
				weekObj[signalID] = 0;
			}	
			weekObj[signalID] += count;

		});

	});

	return signalCounts;

}


function getWeekString(datestring) {

	var m = moment(datestring, 'DD-MM-YYYY');
	return m.isoWeekYear() + "-" + m.isoWeeks();
}


function getMonthString(datestring) {

	var m = moment(datestring, 'DD-MM-YYYY');
	return m.year() + "-" + (m.month() + 1);
}
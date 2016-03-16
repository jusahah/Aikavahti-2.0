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
	
	console.error("STARTING SIGNAL COUNTS");
	console.log(signalsCountPerDate);


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
			console.log("Signal count now: " + monthObj[signalID]);
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

	// datestring = DD.MM.YYYY
	console.log("DATE STRING IN GETWEEKSTRING: " + datestring);

	var m = moment(datestring, 'DD-MM-YYYY');
	console.log("WEEK STRING IS: " + m.isoWeekYear() + "-" + m.isoWeeks());
	return m.isoWeekYear() + "-" + m.isoWeeks();
}


function getMonthString(datestring) {

	// datestring = DD.MM.YYYY
	console.log("DATE STRING IN GET MONTHSTRING: " + datestring);

	var m = moment(datestring, 'DD-MM-YYYY');
	console.log("Month STRING IS: " + m.year() + "-" + (m.month()+1));
	return m.year() + "-" + (m.month() + 1);
}
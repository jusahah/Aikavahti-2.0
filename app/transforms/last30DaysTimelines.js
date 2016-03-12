var _ = require('lodash');
var moment = require('moment');

var POISSA_COLOR = '554455';

module.exports = function(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree, signalsArr, sortedSignalsAndEvents) {

	var today = new Date();

	//var o = createLast30(nowTs);
	var startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
	var earliest = startOfDay - 86400 * 1000 * 30;

	var onlyLast30DaysDurations = _.filter(sortedDurations, function(duration) {
		return duration.start >= earliest;
	});

	var durationsPerDayString = {};

	_.each(onlyLast30DaysDurations, function(duration) {

		// We just assume here that no non-zero duration spans over day limit (earlier transform has taken care of that)
		var dateString = moment(duration.start).format('DD.MM.YY');
		var endOfDay = moment(dateString, 'DD.MM.YY').valueOf() + 86400 * 1000;

		if (!durationsPerDayString.hasOwnProperty(dateString)) {
			durationsPerDayString[dateString] = [];
		}
		var durationCopy = {};
		durationCopy.starting_time = duration.start;
		durationCopy.ending_time   = clampToEndTimestamp(duration.end, endOfDay);
		durationCopy.id            = duration.s;
		durationCopy.d             = duration.d;
		durationCopy.color         = POISSA_COLOR;
		if (parseInt(duration.s) !== 0) {
			var schemaItem = normalizedSchemaTable[duration.s];
			if (schemaItem) {
				durationCopy.color = schemaItem.color;
				durationCopy.name  = schemaItem.name;				
			}

		}

		durationsPerDayString[dateString].push(durationCopy);
	});

	return durationsPerDayString;





}

function clampToEndTimestamp(end, endOfDay) {

	return end > endOfDay ? endOfDay : end;

}


function createLast30(nowTs) {
	var days = [];
	var today = new Date(nowTs);

	var startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
	var endOfDay   = new Date(startOfDay + 86400 * 1000).getTime();

	days.push({
		start: startOfDay,
		end: endOfDay,
		name: moment(startOfDay+1000).format('DD.MM.YY') // Add one thousand so... i dont know... little buffer... oh god thats just stupid tho
	});

	for (var i = 29; i >= 0; i--) {
		startOfDay -= 86400 * 1000;
		endOfDay   -= 86400 * 1000;
		days.push({
			start: startOfDay,
			end: endOfDay,
			name: moment(startOfDay+1000).format('DD.MM.YY')
		});
	};

	return {earliest: startOfDay, days: days};
}
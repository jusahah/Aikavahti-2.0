var _ = require('lodash');

module.exports = function(allData) {
	console.warn("Events in to onlyThisMonth: " + allData.events.length);
	var events = allData.events;
	var startOfMonth = getStartOfMonthTimestamp();

	var filtered = _.filter(events, function(event) {
		return event.t >= startOfMonth;
	});

	allData.events = filtered;
	console.warn("This month so far # of events: " + allData.events.length);

	return allData;

	

}

function getStartOfMonthTimestamp() {
	var d = new Date();

	var dStart = new Date(d.getFullYear(), d.getMonth(), 0);
	return dStart.getTime();
}
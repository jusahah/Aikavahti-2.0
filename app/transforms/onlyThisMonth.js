var _ = require('lodash');

module.exports = function(allData) {

	var events = allData.events;
	var startOfMonth = getStartOfMonthTimestamp();

	var filtered = _.filter(events, function(event) {
		return event.t >= startOfMonth;
	});

	allData.events = filtered;


	return allData;

	

}

function getStartOfMonthTimestamp() {
	var d = new Date();

	var dStart = new Date(d.getFullYear(), d.getMonth(), 0);
	return dStart.getTime();
}
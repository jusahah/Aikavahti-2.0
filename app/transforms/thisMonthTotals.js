var _ = require('lodash');

module.exports = function(allData) {

	// Sort on its own
	var events = allData.events;

	if (events.length === 0) {
		allData.totalsInThisMonth = {};
		return allData;
	}
	var sortedEvents = events.sort(function(e1, e2) {
		return e1.t - e2.t;
	});

	console.log("SORTED IN THISMONTHTOTALS");
	console.log(JSON.stringify(sortedEvents));

	var totalsBySchemaID = {};
	var curr = sortedEvents[0];
	for (var i = 1, j = sortedEvents.length - 1; i < j; i++) {
		var duration = sortedEvents[i].t - curr.t;
		if (!totalsBySchemaID.hasOwnProperty(curr.s)) {
			totalsBySchemaID[curr.s] = 0;
		}

		totalsBySchemaID[curr.s] += duration;
		curr = sortedEvents[i];
	};

	allData.totalsInThisMonth = totalsBySchemaID;
	return allData;

}
module.exports = function(allData) {

	var events = allData.events;

	events = events.sort(function(a, b) {
		return a.t - b.t;
	})

	var durations = [];

	if (events.length === 0) {
		allData.durationsThisMonth = durations;
		return allData;
	}

	var curr = events[0];

	for (var i = 1, j = events.length; i < j; i++) {
		var event = events[i];
		durations.push({
			start: curr.t,
			end: event.t,
			s: curr.s,
			d: event.t - curr.t
		});

		curr = event;
	};

	var now = Date.now();
	durations.push({
		start: curr.t,
		end: now,
		s: curr.s,
		d: now - curr.t
	});

	allData.durationsThisMonth = durations;
	return allData;

}
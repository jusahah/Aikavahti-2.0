module.exports = function(allData) {
	// events are sorted
	var events = allData.events;
	var modifiedEvents = [];

	if (events.length === 0) {
		return allData;
	}

	var curr = events[0];
	for (var i = 1, j = events.length - 1; i < j; i++) {
		var event = events[i];
		var dayChangeTimestamp = getDayChangeTimestamp(curr.t, event.t);
		console.log("---Day change: " + dayChangeTimestamp);
		if (dayChangeTimestamp !== 0) {
			modifiedEvents.push({
				s: 0,
				t: dayChangeTimestamp-1
				
			});
			modifiedEvents.push({
				s: curr.s,
				t: dayChangeTimestamp+1
				
			})

		}
		modifiedEvents.push(event);
		curr = event;

	};

	allData.events = modifiedEvents;
	console.warn('---- add day changes -------');
	console.log(JSON.stringify(allData));
	return allData;
}

function getDayChangeTimestamp(prev, next) {
	console.log("prev " + prev + " vs. next " + next);
	var d1 = new Date(prev);
	var d2 = new Date(next);

	console.log(d1.getDay() + " | " + d2.getDay());

	if (d1.getDay() !== d2.getDay() || d1.getMonth() !== d2.getMonth()) {
		var startOfDay = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
		return startOfDay.getTime();
	}

	return 0;
}
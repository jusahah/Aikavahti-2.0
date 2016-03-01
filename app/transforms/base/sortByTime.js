module.exports = function(allData) {

	allData.events.sort(function(a, b) {
		return a.t - b.t;
	});

	return allData;
	
}
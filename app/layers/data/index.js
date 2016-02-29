var data = [1,2,3,4,5];

module.exports = {
	changeCallback: function(cb) {
		setTimeout(function() {
			cb(data);
		}, 1500+Math.random()*1000);

		setInterval(function() {
			console.log("Calling change callback in data layer!!");
			cb(data);
		}, 10000);

	}
}


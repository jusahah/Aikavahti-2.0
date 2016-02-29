module.exports = {
		error: function(msg) {
			console.error(msg);
		},
		warn: function(msg) {
			console.warn(msg);
		},
		info: function(msg) {
			console.log(msg);
		},
		dev: function(msg) {
			console.log("--DEV--: " + msg);
		}
	
}
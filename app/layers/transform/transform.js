// List of all build-time-known transforms in a system
var bridge = require('./bridge');
module.exports = {

	recompute: function(allData, pipeCb) {
		bridge(allData, pipeCb);
	},

}
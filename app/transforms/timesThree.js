var _ = require('lodash');

module.exports = function(data) {
	k = 4;
	for (var i = 1000*1000*10; i >= 0; i--) {
		k += i;
	};
	return _.map(data, function(item) {
		return item * 3;
	});

}
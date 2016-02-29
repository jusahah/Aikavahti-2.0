var _ = require('lodash');

module.exports = function(data) {
	return _.map(data, function(item) {
		return item * 3;
	});

}
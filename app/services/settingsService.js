var Promise = require('bluebird');

module.exports = function(Box, datalayer) {
	Box.Application.addService('settingsService', function(application) {

		return {
			getSettings: function() {
				var settings = datalayer.fetch('settings');
				return Promise.resolve(settings);
			}
		}


	});
}
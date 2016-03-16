var Promise = require('bluebird');

// This is the layer which should do validations!
module.exports = function(Box, datalayer) {
	Box.Application.addService('adminService', function(application) {

		return {
			importFile: function(file) {
				return datalayer.dataCommandIn({opType: 'admin', op: 'import', data: file})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);	
			},
			exportFile: function(file) {
				return datalayer.dataCommandIn({opType: 'admin', op: 'export', data: file})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);	
			},
			resetProgram: function() {
				return datalayer.dataCommandIn({opType: 'admin', op: 'reset', data: null})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);	
			},
			deploy: function(file) {
				return datalayer.dataCommandIn({opType: 'admin', op: 'deploy', data: file})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);	
			},
			getRestores: function() {
				return datalayer.dataQueryIn('restores');
			},
			forceSave: function() {
				return datalayer.forceSave().then(application.getService('errorService').info);
			}
		}


	});
}
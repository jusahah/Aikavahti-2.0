var Promise = require('bluebird');

// This is the layer which should do validations!
module.exports = function(Box, datalayer) {
	Box.Application.addService('adminService', function(application) {

		return {
			importFile: function(file) {
				return datalayer.dataCommandIn({opType: 'admin', op: 'import', data: file});
			},
			exportFile: function(file) {
				return datalayer.dataCommandIn({opType: 'admin', op: 'export', data: file});
			},
			resetProgram: function() {
				return datalayer.dataCommandIn({opType: 'admin', op: 'reset', data: null});
			},
			deploy: function(file) {
				return datalayer.dataCommandIn({opType: 'admin', op: 'deploy', data: file});
			},
			getRestores: function() {
				return datalayer.dataQueryIn('restores');
			}
		}


	});
}
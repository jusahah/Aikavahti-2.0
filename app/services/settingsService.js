var Promise = require('bluebird');

// This is the layer which should do validations!
module.exports = function(Box, datalayer) {
	Box.Application.addService('settingsService', function(application) {

		return {
			getSettings: function() {
				var settings = datalayer.fetch('settings');
				return Promise.resolve(settings);
			},
			setSettings: function(settings) {
				var data = {
					writeToDiskAfterEveryUpdate: settings.writeToDiskAfterEveryUpdate,
					restorePoint: settings.restorePoint,
				};
				var internet = {
					onlineBackup: settings.onlineBackup,
					backupKey: settings.backupKey
				};

				var p1 = this.setDataSettings(data);
				var p2 = this.setInternetSettings(internet);
				console.warn("Settings passed to next layer down");
				return Promise.all([p1, p2]);
			} ,
			setDataSettings: function(dataObj) {
				return datalayer.dataCommandIn({opType: 'change', treePath: 'settings.data', data: dataObj});
			},
			setInternetSettings: function(dataObj) {
				return datalayer.dataCommandIn({opType: 'change', treePath: 'settings.internet', data: dataObj});
			},
			changeShowLeavesSettings: function(newValue) {
				if (newValue !== true && newValue !== false) return Promise.reject('Incorrect settings value');
				return datalayer.dataCommandIn({opType: 'changeOne', treePath: 'settings.view.eventsOnlyToLeaves', data: newValue});
			},
			recolorSchema: function() {
				return datalayer.dataCommandIn({opType: 'general', data: 'recolor'});
			},
			updateSchemaItem: function(schemaID, schemaUpdatedFields) {
				return datalayer.dataCommandIn({opType: 'changeSchemaItem', data: {
					id: schemaID,
					fields: schemaUpdatedFields
				}});
			},
			createSchemaItem: function(parentID, name, dayGoal) {
				return datalayer.dataCommandIn({opType: 'newSchemaItem', data: {
					parent: parentID,
					name: name,
					color: '6622ee',
					daygoal: dayGoal
				}});
			},
			createMainSchemaItem: function(name, dayGoal) {
				return datalayer.dataCommandIn({opType: 'newSchemaItem', data: {
					parent: -1,
					name: name,
					color: '9944ee',
					daygoal: dayGoal
				}});				
			},
			createSignalItem: function(name, dayGoal) {
				return datalayer.dataCommandIn({opType: 'newSignalItem', name: name, daygoal: dayGoal});
			},
			deleteSignalItem: function(signalID) {
				return datalayer.dataCommandIn({opType: 'deleteSignalItem', data: signalID});
			}
		}


	});
}
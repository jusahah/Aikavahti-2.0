var Promise = require('bluebird');


// This is the layer which should do validations!
module.exports = function(Box, datalayer) {
	Box.Application.addService('settingsService', function(application) {

		return {
			getSettings: function() {
				var settings = datalayer.fetch('settings');
				return Promise.resolve(settings);			
			},
			setDefaultSettings: function() {
				var data = {
					writeToDiskAfterEveryUpdate: true,
					restorePoint: true,
				};	
				return this.setSettings(data);			
			},
			setSettings: function(settings) {
				var data = {
					writeToDiskAfterEveryUpdate: settings.writeToDiskAfterEveryUpdate,
					restorePoint: settings.restorePoint,
				};

				var p1 = this.setDataSettings(data);
				//var p2 = this.setInternetSettings(internet);
				return p1
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);				
			} ,
			setDataSettings: function(dataObj) {
				return datalayer.dataCommandIn({opType: 'change', treePath: 'settings.data', data: dataObj});			
			},
			/*
			setInternetSettings: function(dataObj) {
				return datalayer.dataCommandIn({opType: 'change', treePath: 'settings.internet', data: dataObj})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);				
			},
			*/
			changeShowLeavesSettings: function(newValue) {
				if (newValue !== true && newValue !== false) return Promise.reject('Incorrect settings value');
				return datalayer.dataCommandIn({opType: 'changeOne', treePath: 'settings.view.eventsOnlyToLeaves', data: newValue})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);				
			},
			recolorSchema: function() {
				return datalayer.dataCommandIn({opType: 'general', data: 'recolor'})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);				
			},
			updateSchemaItem: function(schemaID, schemaUpdatedFields) {
				return datalayer.dataCommandIn({opType: 'changeSchemaItem', data: {
					id: schemaID,
					fields: schemaUpdatedFields
				}})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);				
			},
			updateSignalItem: function(signalID, signalUpdatedFields) {
				return datalayer.dataCommandIn({opType: 'changeSignalItem', data: {
					id: signalID,
					fields: signalUpdatedFields
				}})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);	
			},
			createSchemaItem: function(parentID, name, dayGoal) {
				return datalayer.dataCommandIn({opType: 'newSchemaItem', data: {
					parent: parentID,
					name: name,
					color: '6622ee',
					daygoal: dayGoal
				}})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);				
			},
			createMainSchemaItem: function(name, dayGoal) {
				return datalayer.dataCommandIn({opType: 'newSchemaItem', data: {
					parent: -1,
					name: name,
					color: '9944ee',
					daygoal: dayGoal
				}})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);								
			},
			createSignalItem: function(name, dayGoal) {

				return datalayer.dataCommandIn({opType: 'newSignalItem', name: name, daygoal: dayGoal})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);

			},
			deleteSignalItem: function(signalID) {
				return datalayer.dataCommandIn({opType: 'deleteSignalItem', data: signalID})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);
			}
		}


	});
}
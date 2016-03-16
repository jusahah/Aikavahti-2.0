// Admin page module

module.exports = function(Box) {

	Box.Application.addModule('settings', function(context) {
		console.log("INITING SETTINGS VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = ['durationsThisMonth'];

		// Private stuff

		var deactivate = function() {
			if (!isHidden) {
				isHidden = true;
				$el.hide();
			}
		}

		var activate = function() {
			// hide right away in case we are reactivating view that is currently visible
			$el.hide();
			var settingsService = context.getService('settingsService');
			var viewDataPromise = settingsService.getSettings();
			isHidden = false;

			viewDataPromise.then(function(viewData) {
				if (isHidden) return; // User already switched to another view			


				//var dataObj = context.getService('derivedData').easify(viewData);			
				// viewData is always object with transforNames being keys and data being values
				$('#globalLoadingBanner').hide();
				//$el.empty().append("<h3>" + JSON.stringify(viewData) + "</h3>");
				setSettingsDataToView(viewData);
				$el.show();
			});
			
		}


		// Specific to this module
		var gatherAndSendSettings = function() {
			// Gather data from settings form
			var settingsObj = {};
			settingsObj.onlineBackup = $el.find('#onlineBackup_el').val() === '1';
			settingsObj.restorePoint = $el.find('#restorePoint_el').val() === '1';
			settingsObj.writeToDiskAfterEveryUpdate = $el.find('#writeToDiskAfterEveryUpdate_el').val() === '1';
			settingsObj.backupKey = $el.find('#backupKey_el').val();
			// Send settings object to next guy
			var settingsService = context.getService('settingsService');
			settingsService.setSettings(settingsObj);

		}

		var setSettingsDataToView = function(viewData) {
			// Bind data to form fields
			$el.find('#onlineBackup_el').val(viewData.internet.onlineBackup ? "1" : "0");
			$el.find('#writeToDiskAfterEveryUpdate_el').val(viewData.data.writeToDiskAfterEveryUpdate ? "1" : "0");
			$el.find('#restorePoint_el').val(viewData.data.restorePoint ? "1" : "0");
			$el.find('#backupKey_el').val(viewData.internet.backupKey);

		}




		

		// Public API
		return {
			messages: ['routechanged'],
			onclick: function(event, element, elementType) {
				event.preventDefault();

				if (elementType === 'savesettings') gatherAndSendSettings();
			},
			onmessage: function(name, data) {
				if (name === 'routechanged') {
					var route = data.route;
					if (route.split('-')[0] === 'settings') {

						activate();
					} else {
						deactivate();
					}
				} 
				
			}


		};

	});

}

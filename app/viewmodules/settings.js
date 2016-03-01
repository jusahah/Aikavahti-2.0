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
				console.error("SETTINGS VIEW RECEIVED SETTINGS");
				if (isHidden) return; // User already switched to another view			
				console.log("View data");
				console.log(viewData);

				//var dataObj = context.getService('derivedData').easify(viewData);			
				// viewData is always object with transforNames being keys and data being values
				$('#globalLoadingBanner').hide();
				$el.empty().append("<h3>" + JSON.stringify(viewData) + "</h3>");
				$el.show();
			});
			
		}


		

		// Public API
		return {
			messages: ['routechanged'],
			onclick: function(event, element, elementType) {
				console.log("CLICK IN SETTINGS");
			},
			onmessage: function(name, data) {
				console.log("ON MESSAGE IN SETTINGS");
				if (name === 'routechanged') {

					if (data.split('-')[0] === 'settings') {
						console.log("CAUGHT IN SETTINGS");

						activate();
					} else {
						deactivate();
					}
				} 
				
			}


		};

	});

}

// Admin page module

module.exports = function(Box) {

	Box.Application.addModule('manage', function(context) {
		console.log("INITING SETTINGS VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = ['eventList'];

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
			console.log("Activate in manage module");
			var derivedService  = context.getService('derivedData');
			var viewDataPromise = derivedService.getDeriveds(dataNeeded);
			isHidden = false;

			viewDataPromise.then(function(viewData) {
				if (isHidden) return; // User already switched to another view			

				// viewData is always object with transforNames being keys and data being values
				$('#globalLoadingBanner').hide();
				//$el.empty().append("<h3>" + JSON.stringify(viewData) + "</h3>");
				bindToView(viewData.eventList);
				$el.show();
			});
			

		}


		var bindToView = function(eventList) {
			$el.empty().append(JSON.stringify(eventList));
		}



		

		// Public API
		return {
			messages: ['routechanged'],
			onclick: function(event, element, elementType) {
				event.preventDefault();
				console.error("EVENT TARGET");
				console.error(event.target);
				console.log("CLICK IN manage");

				if (elementType === 'savesettings') gatherAndSendSettings();
			},
			onmessage: function(name, data) {
				console.log("ON MESSAGE IN manage");
				if (name === 'routechanged') {

					if (data.split('-')[0] === 'manage') {
						console.log("CAUGHT IN manage");

						activate();
					} else {
						deactivate();
					}
				} 
				
			}


		};

	});

}

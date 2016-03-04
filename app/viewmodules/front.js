// Main front page module

module.exports = function(Box) {
	Box.Application.addModule('front', function(context) {

		console.log("INITING FRONT VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = ['thisMonthTotals']; // empty means that this view can always render instantly (no need to wait on data)
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
			console.log("Activate fron");
			var derivedService  = context.getService('derivedData');
			var viewDataPromise = derivedService.getDeriveds(dataNeeded);
			isHidden = false;

			viewDataPromise.then(function(viewData) {
				if (isHidden) return; // User already switched to another view			

				// viewData is always object with transforNames being keys and data being values
				$('#globalLoadingBanner').hide();
				//$el.empty().append("<h3>" + JSON.stringify(viewData) + "</h3>");
				$el.show();
			});
			

		}

		

		// Public API
		return {
			messages: ['routechanged'],
			onclick: function(event, element, elementType) {
				console.log("CLICK IN VALIKKO");
			},
			onmessage: function(name, data) {
				if (name === 'routechanged') {
					if (data.split('-')[0] === 'front') {
						activate();
					} else {
						deactivate();
					}
				}
			}


		};

	});		
}

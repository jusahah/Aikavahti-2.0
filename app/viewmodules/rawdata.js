// Raw data page module
var fs = require('fs');
var remote = require('remote'); 
var dialog = remote.require('dialog');
var hljs = require('highlight.js');

module.exports = function(Box) {

	Box.Application.addModule('rawdata', function(context) {
		console.log("INITING RAW DATA VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		
		var dataNeeded = [];



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
			var derivedService  = context.getService('derivedData');
			var viewDataPromise = derivedService.getDeriveds(dataNeeded);
			isHidden = false;

			viewDataPromise.then(function(viewData) {
				if (isHidden) return; // User already switched to another view			

				//viewDataCached = viewData;
				var derivedService  = context.getService('derivedData');
				var dataJSON        = derivedService.getDataJSON();
				//var dataObj = context.getService('derivedData').easify(viewData);			
				// viewData is always object with transforNames being keys and data being values
				
				//$el.find('#signalstable_body').empty().append(buildHTML(viewData.signalsTable));
				//$el.empty().append("<h3>" + JSON.stringify(viewData) + "</h3>");
				console.log("APPENDING RAW DATA JSON");
				var h = hljs.highlightAuto(dataJSON);
				$el.find('#rawdata_area').empty().append('<pre><code>' + h.value + '</code></pre>');
				$('#globalLoadingBanner').hide();
				$el.show();
			});
			
		}



		
		// Bind the file input listener
		

		// Public API
		return {
			messages: ['routechanged'],
			onclick: function(event, element, elementType) {
				return;
			},
			onmessage: function(name, data) {
				if (name === 'routechanged') {
					var route = data.route;
					if (route.split('-')[0] === 'rawdata') {

						activate();
					} else {
						deactivate();
					}
				} 
				
			}


		};

	});

}
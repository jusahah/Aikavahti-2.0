// Admin page module
var fs = require('fs');
var remote = require('remote'); 
var dialog = remote.require('dialog');

module.exports = function(Box) {

	Box.Application.addModule('import', function(context) {
		console.log("INITING IMPORT VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());
		var $fileInput = $el.find('#importfile_input');

		
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

				//var dataObj = context.getService('derivedData').easify(viewData);			
				// viewData is always object with transforNames being keys and data being values
				$('#globalLoadingBanner').hide();
				//$el.find('#signalstable_body').empty().append(buildHTML(viewData.signalsTable));
				//$el.empty().append("<h3>" + JSON.stringify(viewData) + "</h3>");
				$el.show();
			});
			
		}

		var exportFile = function() {

			dialog.showSaveDialog(function (fileName) {
				sendExportCommand(fileName);
  			}); 
		}

		var importFile = function() {
  			
			dialog.showOpenDialog(function (fileNames) {
				console.log(fileNames);
				if (fileNames.length === 0) return;
				var file = fileNames[0];
				sendImportCommand(file);
  			}); 

		}

		var sendImportCommand = function(file) {
			var adminService = context.getService('adminService');
			var prom = adminService.importFile(file);

		}

		var sendExportCommand = function(file) {
			var adminService = context.getService('adminService');
			var prom = adminService.exportFile(file);
		
		}

		
		// Bind the file input listener
		

		// Public API
		return {
			messages: ['routechanged'],
			onclick: function(event, element, elementType) {
				console.log("CLICK IN IMPORT");

				if (elementType === 'importfile') {
					importFile();
				} else if (elementType === 'exportfile') {
					exportFile();
				}
			},
			onmessage: function(name, data) {
				if (name === 'routechanged') {
					var route = data.route;
					if (route.split('-')[0] === 'import') {

						activate();
					} else {
						deactivate();
					}
				} 
				
			}


		};

	});

}
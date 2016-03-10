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
			//$el.hide();			
			isHidden = false;	
			setTimeout(function() {
				$('#globalLoadingBanner').hide();	
			}, 0);

			console.warn("IMPORT activate");
			$el.show();
			
		}

		var exportFile = function() {

			dialog.showSaveDialog(function (fileName) {
				sendExportCommand(fileName);
  			}); 
		}

		var importFile = function() {
			console.warn("UPLOADING FILE");
  			
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

			prom.then(function() {
				$el.css('background-color', 'green');
			}).catch(function() {
				$el.css('background-color', 'red');
			});
		}

		var sendExportCommand = function(file) {
			var adminService = context.getService('adminService');
			var prom = adminService.exportFile(file);

			prom.then(function() {
				console.log("EXPORT SUCC");
				$el.css('background-color', 'green');
			}).catch(function() {
				console.log("EXPORT FAIL");
				$el.css('background-color', 'red');
			});			
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
// Restore confirm module
// Note that only a modal is controller by this fucker
var _ = require('lodash');

module.exports = function(Box) {
	Box.Application.addModule('restore', function(context) {

		console.log("INITING RESTORE MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = []; // empty means that this view can always render instantly (no need to wait on data)
		// Private stuff

		var timeString = function(namepart) {
			var parts = namepart.split('-');
			var name;
			try {
				name = parts[2] + "." + parts[1] + "." + parts[0] + " " + parts[3] + ":" + parts[4] + ":" + parts[5];
			} catch (e) {
				name = '--unknown--';
			}

			return name;
			
		}

		var buildTable = function(fileNames) {

			var html = '';

			_.each(fileNames, function(name) {
				html += '<tr>';
				html += '<td>' + timeString(name.split('_')[1]) + '</td>';
				html += '<td><button class="btn btn-danger" data-type="restoreconfirm" data-dismiss="modal" data-payload="' + name + '">Palauta</button></td>';
				html += '</tr>';
			});

			return html;

		}

		var showRestoreModal = function() {
			console.log("Showing restore modal");
			var adminS = context.getService('adminService');
			adminS.getRestores().then(function(fileNames) {
				$el.find('#restorepointcount').empty().append(fileNames.length);
				$el.find('#restores_table_body').empty().append(buildTable(fileNames));
			}).catch(function(e) {
				console.error(e);
			});
			$el.find('#launchRestoreModal').click();
		}

		var restoreConfirmed = function(file) {
			var adminService = context.getService('adminService');
			var prom = adminService.deploy(file);

			prom.then(function() {
				$el.css('background-color', 'green');
			}).catch(function() {
				$el.css('background-color', 'red');
			});
		}

		console.log("INITING INITIALIZATION VIEW MODULE");
		return {
			messages: ['restoremodal'],
			onclick: function(event, element, elementType) {
				console.log("CLICK IN Initialization: " + elementType);

				if (elementType === 'restoreconfirm') {
					restoreConfirmed($(element).data('payload'));
				}
					
				

			},
			onmessage: function(name, data) {
				if (name === 'restoremodal') {
					showRestoreModal();
				}
			}


		};

	});	
}
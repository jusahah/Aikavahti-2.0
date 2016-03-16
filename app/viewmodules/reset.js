// Reset confirm module


module.exports = function(Box) {
	Box.Application.addModule('reset', function(context) {

		console.log("INITING RESET MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = []; // empty means that this view can always render instantly (no need to wait on data)
		// Private stuff

		var showResetModal = function() {
			$el.find('#launchResetModal').click();
		}

		var resetConfirmed = function() {
			var adminService = context.getService('adminService');
			var prom = adminService.resetProgram();
			prom.then(function() {
				Box.Application.broadcast('showInitializationScreen');
			});


		}

		console.log("INITING INITIALIZATION VIEW MODULE");
		return {
			messages: ['resetrequest'],
			onclick: function(event, element, elementType) {
				console.log("CLICK IN Initialization: " + elementType);

				if (elementType === 'resetconfirm') {
					resetConfirmed();
				}
					
				

			},
			onmessage: function(name, data) {
				if (name === 'resetrequest') {
					showResetModal();
				}
			}


		};

	});	
}
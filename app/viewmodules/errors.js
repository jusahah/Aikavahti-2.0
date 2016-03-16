// Errors & notifications module

module.exports = function(Box) {

	Box.Application.addModule('errors', function(context) {
		console.log("INITING ERRORS VIEW MODULE");
		var $el = $(context.getElement());
		var defaultRow = $el.find('#defaultBottomRow');
		var alertRow   = $el.find('#alertBottomRow');

		var showTimer;

		var DURATION = 6000;

		var currAlertCounter = 1;


		// Private stuff

		var showNotification = function(data) {
			console.warn("NOTIFICATION IN ERRORS VIEW");
			console.warn(data);
			var notif = alertRow.find('#aikavahti_notification');

			if (data && typeof(data) === 'object') {
				notif.removeClass('alert-success alert-warning alert-info alert-danger').addClass('alert-' + data.type);
				notif.empty().append(data.msg);
			} else {
				// It is error
				notif.removeClass('alert-success alert-warning alert-info').addClass('alert-danger');
				notif.empty().append(data);
			}
			

			
			//defaultRow.hide();
			alertRow.show();
			
			// Do some css dancing
			notif.addClass('animated').addClass('bounceIn');

			if (showTimer) {
				clearTimeout(showTimer);
			}

			showTimer = setTimeout(backToNormal, DURATION);
		}

		var backToNormal = function() {
			alertRow.find('#aikavahti_notification').removeClass('animated').removeClass('bounceIn');
			alertRow.hide();
			showTimer = null;
		}


		

		// Public API
		return {

			messages: ['notificationTriggered'],

			onmessage: function(name, data) {

				if (name === 'notificationTriggered') {
					showNotification(data);
				}
			}

		}

	});

}

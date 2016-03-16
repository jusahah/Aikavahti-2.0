var Promise = require('bluebird');

// This is the layer which should do validations!
module.exports = function(Box) {
	console.warn("errorService module.exports called");
	Box.Application.addService('errorService', function(application) {
		console.error("ERROR SERVICE OPENING");
		var info = function(msg) {
			application.broadcast('notificationTriggered', {type: 'info', msg: msg});
		}

		var success = function(msg) {
			application.broadcast('notificationTriggered', {type: 'success', msg: msg});
		}

		var notify = function(err) {
			if (!err) return;
			console.warn("IN errorService");
			// Deciding whether to show it to user
			if (typeof(err) !== 'object' || !err.noshow) {
				application.broadcast('notificationTriggered', err);
			}

			if (typeof(err) === 'object') {
				// We need to do logging do some file
				if (err.priv) {
					console.error("---------------------------");
					console.error("INTERNAL ERROR LOG: " + err.priv);
					console.error("---------------------------");					
				}

				throw err.msg;

			} else {
				// err is just a string
				throw err; // Rethrow it so next catch can be triggered if exists
			}
		}

		var dataLayerNotify = function(err) {
			console.warn("MESSED UP IN DATA LAYER");
			console.log(err);
		} 

		return {
			info: info,
			success: success,
			notify: notify,
			dataLayerNotify: dataLayerNotify
		}


	}, {
		exports: ['notify'] // Sigh, does not work. Dunno why.
	});
}
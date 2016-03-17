var moment = require('moment');
var Promise = require('bluebird');

module.exports = function(Box, datalayer) {
	Box.Application.addService('eventService', function(application) {

		var parseDateAndTimeToTimestamp = function(dateString, timeString) {
			console.warn("VALIDATING TIME STRINGS: " + dateString + ", " + timeString);
			var m = moment(dateString + " " + timeString, "DD.MM.YYYY HH:mm", true);

			console.log("SINCE EPOCH: " + m.valueOf());
			return m.valueOf();
		}

		return {
			getCurrent: function() {
				return datalayer.dataQueryIn('currentEvent');
			},
			newSignal: function(signalID) {
				console.warn("NEW SIGNAL IN EVENT SERVICE");
				var timestamp = Date.now();
				return datalayer.dataCommandIn({
					opType: 'newSignal', 
					data: {
						s: parseInt(signalID),
						t: timestamp,
						signal: true
					}
				})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);					

			},

			newSignalCustomDateTime: function(dateString, timeString, signalID) {
				var ts = parseDateAndTimeToTimestamp(dateString, timeString);
				if (!ts) {
					return Promise.reject('Signaalitapahtuman luonti epäonnistui! Tarkista, että syöttämäsi arvot ovat asianmukaiset.').catch(application.getService('errorService').notify);
				}
				return datalayer.dataCommandIn({
					opType: 'newSignal', 
					data: {
						s: parseInt(signalID),
						t: ts,
						signal: true
					}
				})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);				

			},			
			newEvent: function(schemaID) {
				var timestamp = Date.now();
				return datalayer.dataCommandIn({
					opType: 'new', 
					afterWards: false,
					treePath: 'events', 
					data: {
						s: schemaID,
						t: timestamp,
						signal: false
					}
				})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);	
			},
			newEventCustomDateTime: function(dateString, timeString, schemaID, notes) {

				notes = _.trim(notes) === '' ? undefined : notes;

				var ts = parseDateAndTimeToTimestamp(dateString, timeString);
				if (!ts) {
					return Promise.reject('DateTime validation error!');
				}
				return datalayer.dataCommandIn({
					opType: 'new', 
					afterWards: true,
					treePath: 'events', 
					data: {
						s: schemaID,
						t: ts,
						signal: false,
						notes: notes
					}
				})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);	

			},
			deleteEvent: function(timestamp, schemaID) {
				if (!timestamp || !schemaID) return Promise.reject('Data invalid - can not delete event');
				return datalayer.dataCommandIn({
					opType: 'delete', 
					treePath: 'events', 
					data: {
						s: schemaID,
						t: timestamp
					}					
				})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);	
			},
			saveNotes: function(timestamp, notes) {
				return datalayer.dataCommandIn({
					opType: 'savenotes', 
					treePath: 'events', 
					data: {
						t: timestamp,
						notes: notes
					}					
				})
				.then(application.getService('errorService').success)
				.catch(application.getService('errorService').notify);				
			}
		}

	});

}
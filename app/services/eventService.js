var moment = require('moment');
var Promise = require('bluebird');

module.exports = function(Box, datalayer) {
	Box.Application.addService('eventService', function(application) {

		var parseDateAndTimeToTimestamp = function(dateString, timeString) {
			console.warn("VALIDATING TIME STRINGS: " + dateString + ", " + timeString);
			var m = moment(dateString + " " + timeString, "DD.MM.YYYY HH:mm");

			console.log("SINCE EPOCH: " + m.valueOf());
			return m.valueOf();
		}

		return {

			newEvent: function(schemaID) {
				var timestamp = Date.now();
				return datalayer.dataCommandIn({
					opType: 'new', 
					treePath: 'events', 
					data: {
						s: schemaID,
						t: timestamp
					}
				});
			},
			newEventCustomDateTime: function(dateString, timeString, schemaID) {

				var ts = parseDateAndTimeToTimestamp(dateString, timeString);
				if (!ts) {
					return Promise.reject('DateTime validation error!');
				}
				return datalayer.dataCommandIn({
					opType: 'new', 
					treePath: 'events', 
					data: {
						s: schemaID,
						t: ts
					}
				});

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
			}
		}

	});

}
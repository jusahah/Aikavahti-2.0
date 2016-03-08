module.exports = function(Box, datalayer) {
	Box.Application.addService('eventService', function(application) {

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
			}
		}

	});

}
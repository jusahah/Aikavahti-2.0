var _ = require('lodash');
var moment = require('moment');


module.exports = function(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree, signalsArr, sortedSignalsAndEvents) {

	var onlySignals = _.filter(sortedSignalsAndEvents, function(eventOrSignal) {
		return eventOrSignal.signal;
	});

	var addToCumulative = function(ds, signalID, cumulativeTable) {
			if (!cumulativeTable.hasOwnProperty(ds)) {
				cumulativeTable[ds] = {};
			}

			if (!cumulativeTable[ds].hasOwnProperty(signalID)) {
				cumulativeTable[ds][signalID] = 0;
			}

			++cumulativeTable[ds][signalID];		
	}

	var dateToCountPerSignalId = {};

	_.each(onlySignals, function(signal) {
		var dateString = getDateString(signal.t);
		addToCumulative(dateString, signal.s, dateToCountPerSignalId);

	});


	return dateToCountPerSignalId;


}

function getDateString(timestamp) {
	return moment(timestamp).format('DD-MM-YYYY');
}


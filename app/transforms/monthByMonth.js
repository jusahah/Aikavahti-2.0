var _ = require('lodash');
var moment = require('moment');

var dayByDayPerSchemaId = require('./dayByDayPerSchemaId');


module.exports = function(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree, signalsArr, sortedSignalsAndEvents) {
	if (sortedEvents.length === 0) return {};

	// Lets reuse earlier transform
	// Note that this leads dayByday-stuff being needlessly computed twice!
	// So perhaps optimize later by caching it somehow 
	var schemaItemsArr = _.keys(normalizedSchemaTable);

	var dayByDayResults = dayByDayPerSchemaId(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree, signalsArr, sortedSignalsAndEvents);

	dayByDayResults = sumGroupTotals(dayByDayResults, normalizedSchemaTable, schemaItemsArr);
	var monthsToDurations = {};

	_.forOwn(dayByDayResults, function(schemaIDsToDurations, datestring) {
		var monthString = getMonthString(datestring);
		if (!monthsToDurations.hasOwnProperty(monthString)) {
			monthsToDurations[monthString] = {};
		}

		var monthObj = monthsToDurations[monthString];

		_.forOwn(dayByDayResults[datestring], function(duration, schemaID) {
			if (!monthObj.hasOwnProperty(schemaID)) {
				monthObj[schemaID] = 0;
			}

			monthObj[schemaID] += duration;
		});
	});
	console.warn("monthS TO DURATIONS");
	console.log(JSON.stringify(monthsToDurations));

	//return makeItSortedArray(weeksToDurations);
	return monthsToDurations;

}


function getMonthString(datestring) {

	// datestring = DD.MM.YYYY
	console.log("DATE STRING IN GET MONTHSTRING: " + datestring);

	var m = moment(datestring, 'DD.MM.YYYY');
	console.log("Month STRING IS: " + m.year() + "-" + (m.month()+1));
	return m.year() + "-" + (m.month() + 1);
}

function makeItSortedArray(monthsTable) {
	var arr = [];
	_.forOwn(monthsTable, function(monthObj, monthString) {
		arr.push({monthString: monthString, obj: monthObj});
	});

	return _.sortBy(arr, function(obj) {
		return obj.monthString;
	})
}

function sumGroupTotals(results, schemaItems, schemaItemsArr) {


	_.forOwn(results, function(obj, _dateString) {
		var origCopy = Object.assign({}, obj);
		_.each(schemaItemsArr, function(schemaID) {
			var sum = 0;
			var kids = getAllKids(schemaID, schemaItems);

			kids = _.flattenDeep(kids);
			kids.push(schemaID); // add myself
			kids = _.uniq(kids);
			console.warn("KIDS FOR: " + schemaID);
			console.log(kids);
			_.each(kids, function(kid) {
				if (origCopy.hasOwnProperty(kid)) {
					sum += origCopy[kid];
				}
			});

			obj[schemaID] = sum;

		});


		
	});
	console.error("GROUP SUMS -----------------");
	console.log(results);
	return results;
}

function getAllKids(schemaID, schemaItems) {

	var kids = schemaItems[schemaID].children;

	if (!kids || kids.length === 0) return [];

	var localArr = [];

	_.each(kids, function(kidID) {
		localArr.push(kidID);
		localArr = _.concat(localArr, getAllKids(kidID, schemaItems));
	});

	return localArr;


}
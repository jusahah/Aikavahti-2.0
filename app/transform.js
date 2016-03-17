import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { greet } from './hello_world/hello_world'; // code authored by you in this project
import env from './env';

var _ = require('lodash');
var moment = require('moment');

var transforms = require('./transforms').list; // gets index.js

var ipcTransformer = require('electron').ipcRenderer;

var currentBatchID;

ipcTransformer.on('computationrequest', function(event, data) {

	receiveComputationRequest(data);
});

function filterActivitiesAway(eventsAndSignals) {
	return _.filter(eventsAndSignals, function(eventOrSignal) {
		return eventOrSignal.signal;
	});
}

function filterSignalsAway(eventsAndSignals) {
	return _.filter(eventsAndSignals, function(eventOrSignal) {
		return !eventOrSignal.signal;
	});
}

function sortEvents(events) {
	return events.sort(function(a, b) {
		return b.t - a.t;
	});
}

function addCurrent(events) {
	if (events.length === 0) return [];
	var currentEvent = Object.assign({}, events[0]);
	currentEvent.t = Date.now();
	var newEvents = [currentEvent];

	for (var i = 0, j = events.length; i < j; i++) {
		newEvents.push(events[i]);
	};

	return newEvents;
}

function durationalizeEvents(events) {

	// events is sorted DESC by timestamp and day change stuff is added
	
	if (events.length === 0) {
		return [];
	}

	var durations = [];
	var currTime = Date.now();

	for (var i = 0, j = events.length; i < j; i++) {
		var event = events[i];
		durations.push({
			start: event.t,
			notes: event.notes,
			end: currTime,
			s: event.s,
			d: currTime - event.t
		});

		currTime = event.t;
	};

	return durations;
} 

function addDayChanges(events) {

	// events is sorted DESC by timestamp



	if (events.length === 0) {
		return [];
	}
	var modifiedEvents = [];

	var curr = events[0];
	modifiedEvents.push(curr);
	for (var i = 1, j = events.length - 1; i <= j; i++) {

		var event = events[i];
		event.human = moment(event.t).format('DD.MM.YYYY HH:mm:ss');
		var dayChangeTimestamps = getDayChangeTimestamp(event.t, curr.t);


		if (dayChangeTimestamps.length !== 0) {
			var schemaID = event.s;
			for (var i2 = dayChangeTimestamps.length - 1; i2 >= 0; i2--) {
				var dayChangeTimestamp = dayChangeTimestamps[i2];
				modifiedEvents.push({
					s: parseInt(schemaID),
					t: dayChangeTimestamp+1,
					human: moment(dayChangeTimestamp+1).format('DD.MM.YYYY HH:mm:ss')
					
				});
				modifiedEvents.push({
					s: 0,
					t: dayChangeTimestamp-1,
					human: moment(dayChangeTimestamp-1).format('DD.MM.YYYY HH:mm:ss')
					
				});
			};


		}
		modifiedEvents.push(event);
		curr = event;

	};
	modifiedEvents = _.sortBy(modifiedEvents, function(event) {
		return (-1)*event.t;
	});


	return modifiedEvents;

}

function getDayChangeTimestamp(prev, next) {

	var d1 = new Date(prev);
	var d2 = new Date(next);

	var interDays = [];


	if (d1.getDay() !== d2.getDay() || d1.getMonth() !== d2.getMonth()) {
		var startOfDay = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
		var startOfDayTs = startOfDay.getTime();
		interDays.push(startOfDayTs);
		startOfDayTs = startOfDayTs - 86400 * 1000;
		while (startOfDayTs > prev) {
			interDays.push(startOfDayTs);
			startOfDayTs -= 86400 * 1000;
		}
	}

	return interDays;
}

function normalizeChildrenToIDs(childrenArray) {
	childrenArray = childrenArray || [];
	return _.map(childrenArray, function(child) {
		return child.id;
	})
}

function normalizeSchemaTree(schemaTree) {

	var table = {};


	var traverse = function(branch) {
		_.each(branch, function(child) {

			table[child.id] = _.assign({}, child);
			table[child.id].children = normalizeChildrenToIDs(child.children);
			if (child.hasOwnProperty('children') && child.children.length > 0) {
				traverse(child.children);
			
			}
		});	

		
		
	}

	
	
	traverse(schemaTree);

	return table;

}

function receiveComputationRequest(data) {

	var signalsArr = data.data.signals;
	// data = {batchID: int, data: {...}}
	var schemaTree = data.data.schema['_root_']; // To be passed to each transform as 2nd arg

	// push our custom (poissa) schema item there too
	//schemaTree.push({name: '(poissa)', id: 0, color: '554455'});

	var schemaNormalizedTable = normalizeSchemaTree(schemaTree);

	var settingsTree = data.data.settings;
	console.log("Received computationrequest");
	var batchID = data.batchID;
	currentBatchID = data.batchID;
	data = data.data; // Yes, oh yes.
	var cachedResults = {}; // name -> results hashtable
	var transformsList = transforms.slice();
	var transformListLen = transformsList.length;
	var dones = 0;


	var calcStartTime = Date.now();

	var sortedSignalsAndEvents = sortEvents(data.events);
	var noSignals    = filterSignalsAway(data.events);
	//var onlySignals  = filterActivitiesAway(data.events);
	var sortedEvents = sortEvents(noSignals);
	//addCurrent(sortedEvents);
	var sortedEventsWithCurrent = addCurrent(sortedEvents);
	var dayChangesAdded = addDayChanges(sortedEventsWithCurrent);
	var sortedDurations = durationalizeEvents(dayChangesAdded);

	function percentageDone() {
		return Math.round(100*dones / transformListLen);
	}
	/*
	function calcOne(transformSelected) {
		if (batchID !== currentBatchID) {
			// We abort current calculations and move to higher batch ID one
			console.warn("Higher batch ID detected - stopping previous calculation");
			return;
		}
		var next;
		if (transformsList.length !== 0) {
			transformSelected = transformSelected || transformsList[0];
			if (!transformSelected.prerequisite || cachedResults.hasOwnProperty(transformSelected.prerequisite)) {
				// The dep for this one has been fulfilled -> just calc
				next = transformsList.shift();
				// Fake apply here
				// next.transform(data);
				console.log("RUNNING TRANSFORM: " + next.name);
				console.log(next);
				var toBeSentData = transformSelected.prerequisite ? cachedResults[transformSelected.prerequisite] : data;
				var results = next.transform(toBeSentData, schemaData);
				cachedResults[next.name] = results;
				dones++;
				sendResults(next.name, results, batchID, percentageDone());
				setTimeout(calcOne, 0);
			} else {
				// Move the first element to last and try again
				next = transformsList.shift();
				transformsList.push(next); // Length does not change
				setTimeout(calcOne, 0);
			}			

		}
	}
	*/

	function calcOne() {
		if (batchID !== currentBatchID) {
			// We abort current calculations and move to higher batch ID one
			return;
		}
		
		if (transformsList.length !== 0) {
			var transformSelected = transformsList.shift();
			var results;	
			try {
				results = transformSelected.transform(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, schemaNormalizedTable, settingsTree, signalsArr, sortedSignalsAndEvents);	
			} catch (e) {
				console.error("-------------------_ERROR ERROR -----------------");
				console.log(e);
				results = null;
			}
			dones++;
			sendResults(transformSelected.name, results, batchID, percentageDone(), calcStartTime);
			setTimeout(calcOne, 0);
		} 
					
	}

	calcOne(); // Start the timeout loop	
	/*
	_.each(transforms, function(transform) {
		var res = transform.fun(data); // its this simple
		ipcTransformer.send('computationresult', {name: transform.name, results: res, batchID: data.batchID});
	});
	// simply run all transforms through one by one
	*/
}

function sendResults(name, results, batchID, percentageDone, calcTime) {

	ipcTransformer.send('computationresult', {calcTime: calcTime, name: name, results: results, batchID: batchID, percentageDone: percentageDone});
	var k = 8;
	for (var i = 0 * 1000 * 1000; i >= 0; i--) {
		k += i;
	};
}




import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { greet } from './hello_world/hello_world'; // code authored by you in this project
import env from './env';

var _ = require('lodash');

var transforms = require('./transforms').list; // gets index.js

var ipcTransformer = require('electron').ipcRenderer;

var currentBatchID;

ipcTransformer.on('computationrequest', function(event, data) {
	console.log("Computation req in transformer!");
	receiveComputationRequest(data);
});

function sortEvents(events) {
	return events.sort(function(a, b) {
		return b.t - a.t;
	});
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

	// we change the order first

	if (events.length === 0) {
		return [];
	}
	var modifiedEvents = [];

	var curr = events[0];
	for (var i = 1, j = events.length - 1; i < j; i++) {
		var event = events[i];
		var dayChangeTimestamp = getDayChangeTimestamp(event.t, curr.t);
		console.log("---Day change: " + dayChangeTimestamp);
		if (dayChangeTimestamp !== 0) {
			modifiedEvents.push({
				s: curr.s,
				t: dayChangeTimestamp+1
				
			});
			modifiedEvents.push({
				s: 0,
				t: dayChangeTimestamp-1
				
			})

		}
		modifiedEvents.push(event);
		curr = event;

	};

	return modifiedEvents;

}

function getDayChangeTimestamp(prev, next) {
	console.log("prev " + prev + " vs. next " + next);
	var d1 = new Date(prev);
	var d2 = new Date(next);

	console.log(d1.getDay() + " | " + d2.getDay());

	if (d1.getDay() !== d2.getDay() || d1.getMonth() !== d2.getMonth()) {
		var startOfDay = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
		return startOfDay.getTime();
	}

	return 0;
}

function normalizeSchemaTree(schemaTree) {

	var table = {};
	console.warn("Traverse start");

	var traverse = function(branch) {
		_.each(branch, function(child) {
			console.log(child.name);
			table[child.id] = child;
			if (child.hasOwnProperty('children') && child.children.length > 0) {
				traverse(child.children);
			
			}
		});	

		
		
	}

	
	
	traverse(schemaTree);
	console.log("TABLE IS");
	console.log(table);
	return table;

}

function receiveComputationRequest(data) {
	// data = {batchID: int, data: {...}}
	var schemaTree = data.data.schema['_root_']; // To be passed to each transform as 2nd arg
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
	console.log("Start calc all");

	var sortedEvents = sortEvents(data.events);
	var dayChangesAdded = addDayChanges(sortedEvents);
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
			console.warn("Higher batch ID detected - stopping previous calculation");
			return;
		}
		
		if (transformsList.length !== 0) {
			var transformSelected = transformsList.pop();
			var results;	
			try {
				results = transformSelected.transform(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, schemaNormalizedTable, settingsTree);	
			} catch (e) {
				results = null;
			}
			dones++;
			sendResults(transformSelected.name, results, batchID, percentageDone());
			setTimeout(calcOne, 0);
		} else {
			console.warn("Transformations completed");
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

function sendResults(name, results, batchID, percentageDone) {
	console.log("RESULTS FOR: " + name);
	ipcTransformer.send('computationresult', {name: name, results: results, batchID: batchID, percentageDone: percentageDone});
}




import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { greet } from './hello_world/hello_world'; // code authored by you in this project
import env from './env';

var _ = require('lodash');

var transforms = require('./transforms').list; // gets index.js

var ipcTransformer = require('electron').ipcRenderer;

ipcTransformer.on('computationrequest', function(event, data) {
	console.log("Computation req in transformer!");
	receiveComputationRequest(data);
});

function receiveComputationRequest(data) {
	console.log("Received computationrequest");
	console.log(data);
	var batchID = data.batchID;
	data = data.data; // Yes, oh yes.
	var cachedResults = {}; // name -> results hashtable
	var transformsList = transforms.slice();
	console.log(transformsList);
	console.log("Start calc all");
	function calcOne(transformSelected) {

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
				var results = next.transform(toBeSentData);
				cachedResults[next.name] = results;
				sendResults(next.name, results, batchID);
				setTimeout(calcOne, 0);
			} else {
				// Move the first element to last and try again
				next = transformsList.shift();
				transformsList.push(next); // Length does not change
				setTimeout(calcOne, 0);
			}			

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

function sendResults(name, results, batchID) {
	console.log("RESULTS FOR: " + name);
	console.log(results);
	ipcTransformer.send('computationresult', {name: name, results: results, batchID: batchID});
}




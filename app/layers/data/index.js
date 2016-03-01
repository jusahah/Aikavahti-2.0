var fs = require('fs-extra'); //var fs = require('fs') 
var util = require('util');
var _ = require('lodash');

var dataSchema = require('./dataSchema');
 
var file = __dirname + '/appdata.json';

var appData = [1,2,3,4,5];
var changeCb;

var dataLayerSettings;

var schemaIDCounter = 1;

function fetchFromDB(cb) {
	fs.readJson(file, function(err, jsonObj) {
	  console.warn("READ FROM FILE");
	  console.log(jsonObj); //0.1.3 
	}); 
}

function pushToDB(jsonObj, cb) {
	console.warn("Push to file!");
	fs.writeJson(file, jsonObj, cb);

}

function getInitialDataObject() {
	return {
		events: [],
		schema: {
			_root_: [
				{name: 'Work', id: 1, children: [
					{name: 'Coding', id: 11},
					{name: 'Selling', id: 12}
				]},
				{name: 'Study', id: 2, children: []},
				{name: 'Leisure', id: 3, children: []}
			]
		},
		triggers: {},
		settings: {
			data: {
				writeToDiskAfterEveryUpdate: true

			},
			internet: {
				onlineBackup: false
			}
		}
	};
}

function createFileIfNotExist() {

	try {
		var stats = fs.statSync(file);
	} catch (e) {
		console.warn("---Creating data file---");
		fs.createFileSync(file);
		fs.writeJsonSync(file, getInitialDataObject());
	}
	// FFor now just write each time from fresh
	fs.writeJsonSync(file, getInitialDataObject());
}

function loadToMemory() {
	//fs.createFileSync(file);
	try {
		var data = fs.readJsonSync(file);
	} catch(e) {
		console.log(e);
	}
	
	console.log(data);
	appData = data;


}

function copyOfData() {
	return JSON.parse(JSON.stringify(appData));
}

function copify(partOfDataTree) {
	return JSON.parse(JSON.stringify(partOfDataTree));
}

function generateSchemaID() {
	var s = Date.now() + "" + schemaIDCounter++; // Make sure its string first!
	return parseInt(s);
}

function writeToDiskIfNeeded() {
	console.log("APP DATA NOW");
	console.log(JSON.stringify(appData));
	return new Promise(function(resolve, reject) {
		if (appData.settings.data.writeToDiskAfterEveryUpdate) {
			pushToDB(appData, function(err) {
				if (err) reject(err);
				else resolve();
			});
		} else {
			setTimeout(resolve, 0);
		}
	});

}
//
// Modify/create/delete private functions
//
function modifySettings(path, data) {
	console.warn("MODIFY SETTINGS: " + path);
	var parts = path.split('.');
	var last  = parts.pop();
	var currTraversing = appData;
	_.each(parts, function(part) {
		currTraversing = currTraversing[part];
	});	
	console.log(currTraversing);
	currTraversing[last] = data;
	return writeToDiskIfNeeded();
}

function modifySchemaItem(pathParts, updatedSchemaItem) {
	// Find item using id
	// Overwrite new data in
	// Resolve promise
	/*
	if (!appData.schema.hasOwnProperty(updatedSchemaItem.id)) {
		return Promise.reject('Schema item not found');
	}

	appData.schema[updatedSchemaItem.id] = updatedSchemaItem; // Its this simple
	*/
	// ID generation for new schema item!
	pathParts.shift(); // Remove first which is 'schema'
	var currentChildren = appData.schema['_root_'];
	var last = pathParts.pop();
	console.log(pathParts);

	// Hunt down the parent
	_.each(pathParts, function(part) {
		console.log("Current children");
		console.log(JSON.stringify(currentChildren));
		var found = false;
		for(var i = 0, j = currentChildren.length; i < j; i++) {

			console.log(currentChildren[i]);
			var child = currentChildren[i];
			console.log("Comparing in schema traversal: " + child.id + " vs. " + part);
			if (parseInt(child.id) === parseInt(part)) {
				// Found next level
				currentChildren = child.children;
				found = true;
				break;
			}
		}

		if (!found) throw 'Child not found in modifySchemaItem';

		
	});

	console.log("CHILDREN HUNTED DOWN");
	// Find the parent now
	var theItem;
	for(var i = 0, j = currentChildren.length; i < j; i++) {
		if (parseInt(currentChildren[i].id) === parseInt(last)) {
			theItem = currentChildren[i];
			break;
		}
	}
	
	if (!theItem) throw 'Final child not found in modifySchemaItem';

	if (parseInt(theItem.id) !== parseInt(updatedSchemaItem.id)) {
		throw 'ID Mismatch in modifySchemitem: ' + theItem.id + " vs. " + updatedSchemaItem.id;
	}
	// We dont allow mass assigment edit
	// Instead edit field by field
	theItem.name = updatedSchemaItem.name;
	theItem.color = updatedSchemaItem.color;

	console.log(JSON.stringify(appData));

	var diskPromise = writeToDiskIfNeeded();
	return diskPromise;
}

function addEvent(eventData) {
	appData.events.push(eventData);
	return writeToDiskIfNeeded();

}

function addSchemaItem(pathParts, schemaData) {
	// ID generation for new schema item!
	pathParts.shift(); // Remove first which is 'schema'
	var currentChildren = appData.schema['_root_'];
	var last = pathParts.pop();
	console.log(pathParts);

	// Hunt down the parent
	_.each(pathParts, function(part) {
		console.log("Current children");
		console.log(JSON.stringify(currentChildren));
		var found = false;
		for(var i = 0, j = currentChildren.length; i < j; i++) {

			console.log(currentChildren[i]);
			var child = currentChildren[i];
			console.log("Comparing in schema traversal: " + child.id + " vs. " + part);
			if (parseInt(child.id) === parseInt(part)) {
				// Found next level
				currentChildren = child.children;
				found = true;
				break;
			}
		}

		if (!found) throw 'Child not found in addSchemaItem';

		
	});

	console.log("CHILDREN HUNTED DOWN");
	// Find the parent now
	var parentItem;
	for(var i = 0, j = currentChildren.length; i < j; i++) {
		if (parseInt(currentChildren[i].id) === parseInt(last)) {
			parentItem = currentChildren[i];
			break;
		}
	}
	
	if (!parentItem) throw 'Final child not found in addSchemaItem';

	if (!parentItem.hasOwnProperty('children')) parentItem.children = [];

	schemaData.id = generateSchemaID();
	parentItem.children.push(schemaData);
	//appData.schema[schemaData.id] = schemaData;
	console.log(JSON.stringify(appData));

	return writeToDiskIfNeeded();

}

function deleteSchemaItem(pathParts, schemaData) {

}



module.exports = {
	changeCallback: function(cb) {
		changeCb = cb;
		/*
		setTimeout(function() {
			cb(data);
		}, 1500+Math.random()*1000);

		setInterval(function() {
			console.log("Calling change callback in data layer!!");
			cb(data);
		}, 10000);
		*/

	},
	// Returns promise!
	dataCommandIn: function(dataCommand) {
		/*
		dataCommand = {
			opType: change/new/delete
			treePath: 'settings.data'
			data: {...}
		}
		*/
		// do changes etc. whatever is need

		// Note that for event timestamp is already inserted!
		var pathParts = dataCommand.treePath.split('.');
		var firstPath = pathParts[0];
		var err = dataSchema.validate(dataCommand.treePath, dataCommand.data);
		if (err) {
			console.error("Validation failed in data layer dataCommandIn!");
			console.log(err);
		}

		// Data is good

		if (dataCommand.opType === 'change') {
			// Note that events can not be modified - only deleted and created
			if (firstPath === 'schema') {
				return modifySchemaItem(pathParts, dataCommand.data);
			} else {
				return modifySettings(dataCommand.treePath, dataCommand.data);
			}
		} else if (dataCommand.opType === 'new') {
			if (firstPath === 'events') {
				return addEvent(dataCommand.data);
			} else if (firstPath === 'schema') {
				return addSchemaItem(pathParts, dataCommand.data);
			}
		} else if (dataCommand.opType === 'delete') {
			if (firstPath === 'events') {
				return deleteEvent(dataCommand.data);
			} else if (firstPath === 'schema') {
				return deleteSchemaItem(pathParts, dataCommand.data);
			}			
		}

		console.error("No clause matched in dataCommandIn!");
		console.log(dataCommand);
		return Promise.reject('Clause match failed in dataCommandIn');


	},
	// Returns promise!
	getAll: function() {
		return copyOfData();
	},

	fetch: function(dataTag) {
		//dataTag is route inside the data tree to appropriate item
		//for example 'settings.data' or 'events'
		var parts = dataTag.split('.');
		var currTraversing = appData;
		_.each(parts, function(part) {
			if (currTraversing.hasOwnProperty(part)) {
				currTraversing = currTraversing[part];
			} else {
				throw 'Schema does not follow dataTag: ' + dataTag;
			}
		});

		return copify(currTraversing);
	},

	init: function(cb) {
		if (cb) this.changeCallback(cb);
		createFileIfNotExist();
		loadToMemory();

	},


}
/*
setTimeout(function() {
	pushToDB({name: 'jaakko'});
}, 1900);

setTimeout(function() {
	fetchFromDB();
}, 2500);
*/
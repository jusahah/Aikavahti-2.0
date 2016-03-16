var fs = require('fs-extra'); //var fs = require('fs') 
var util = require('util');
var _ = require('lodash');
var moment = require('moment');

var dataSchema = require('./dataSchema');

// Coloring
var colorAssigner = require('./colorassigner');
 
var file = __dirname + '/appdata.json';
var restoreDir = __dirname + '/restorepoints/';

var appData = [1,2,3,4,5];
var changeCb;
var changeCbDisabled = false;

var dataLayerSettings;

var schemaIDCounter = 1;

var POISSA_COLOR = '554455';

function getRestoreFileName() {
	var m = moment();
	return 'restore_' + m.format('YYYY-MM-DD-HH-mm-ss') + '_' + Math.floor(Math.random()*1000000) + ".json";
	
}

function deployRestoreFile(fileName) {
	var fullpath = restoreDir + fileName;
	try {
		var data = fs.readJsonSync(fullpath);
	} catch(e) {
		console.log(e);
		console.error("Restore point loading failed!");
		return Promise.reject({msg: 'Palautuspisteen käyttö epäonnistui.', priv: e});
	}
	
	console.log(data);
	appData = data;
	
	return writeToDiskIfNeeded(null, 'Palautuspiste otettu käyttöön tiedostosta: <strong>' + fileName + '</strong>');
} 

function checkRestorePoints() {
	console.warn("Check restore points");

	if (!appData.settings.data.restorePoint) {
		console.log("INIT: Skipping restore point - user has disabled it");
		return;
	}

	var fileNames = fs.readdirSync(restoreDir);
	console.log(fileNames);

	var restoreFiles = _.filter(fileNames, function(name) {
		console.log(restoreDir + name);
		return _.startsWith(name, 'restore');
	});

	if (restoreFiles.length >= 5) {
		//Drop the oldest one
		restoreFiles = restoreFiles.sort();
		var toBeRemoved = restoreFiles[0];
		console.log("INIT: Removing old restorepoint: " + restoreDir + toBeRemoved);
		fs.unlinkSync(restoreDir + toBeRemoved);

	}
	var newFile = restoreDir + getRestoreFileName();

	fs.createFile(newFile, function(err) {
		if (err) {
			console.error(err);
			return;
		}
		fs.outputJson(newFile, appData, function(err) {
			if (err) console.error(err);
			else console.log("INIT: Restore point created at " + moment().format('DD.MM.YYYY HH:mm:ss'));
		})

	});


}

function listRestorePoints() {

	return new Promise(function(resolve, reject) {
		fs.readdir(restoreDir, function(err, fileNames) {
			if (err) return reject({msg: 'Palautuspisteiden lukeminen levyltä epäonnistui.', priv: err});
			//console.log(fileNames);

			var restoreFiles = _.filter(fileNames, function(name) {
				return _.startsWith(name, 'restore');
			});

			restoreFiles = restoreFiles.sort();
			return resolve(restoreFiles);
		});		
	});

}

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
// Goal addition to application's data schema starts now
function getInitialDataObject() {
	return {
		events: [],
		schema: {
			_root_: [
				{daygoal: 'gt_' + 3600*1000*6, color: '884455', name: 'Työ', id: 1, children: [
					{daygoal: 'gt_' + 3600*1000*6, color: '554488', name: 'PHP', id: 11, children: []},	
					{daygoal: 'gt_' + 3600*1000*6, color: '554488', name: 'Javascript', id: 12, children: [
						{daygoal: 'gt_' + 3600*1000*6, color: '554488', name: 'Node.js', id: 121, children: []},	
						{color: '554488', name: 'Browser development', id: 122, children: []},	
						{daygoal: '', color: '554488', name: 'Electron App', id: 123, children: []},	

					]},	

				]},
				{daygoal: 'gt_' + 3600*1000*6, color: '559955', name: 'Opinnot', id: 2, children: [
					{daygoal: 'gt_' + 3600*1000*6, color: '554488', name: 'Kirjallisuus', id: 21, children: []},
				]},
				{daygoal: 'gt_' + 3600*1000*6, color: '554488', name: 'Vapaa-aika', id: 3, children: [
					{daygoal: 'gt_' + 3600*1000*6, color: '554488', name: 'Tennis', id: 31, children: []},		
					{daygoal: 'gt_' + 3600*1000*6, color: '554488', name: 'Jalkapallo', id: 32, children: []},	
					{daygoal: 'gt_' + 3600*1000*5, color: '554488', name: 'Lounas', id: 33, children: [
						{daygoal: 'gt_' + 3600*1000*4, color: '554488', name: 'Stockmann', id: 331, children: []},	

					]},		
					{daygoal: 'lt_' + 3600*1000*3, color: '554488', name: 'Sählinki', id: 34, children: []},	
					{daygoal: 'gt_' + 3600*1000*2, color: '554488', name: 'TV:n katselu', id: 35, children: []},
					{daygoal: 'gt_' + 3600*1000*1, color: '554488', name: 'Runoillat', id: 36, children: []},
				]}
			]
		},
		triggers: {},
		signals: [
			{daygoal: 'e_' + 1, name: 'Kahvi', id: 9999},
			{daygoal: 'le_' + 2, name: 'Olut', id: 9998},
			{daygoal: 'gt_' + 5, name: 'Punaviini', id: 9997},
		],
		settings: {
			data: {
				writeToDiskAfterEveryUpdate: true,
				restorePoint: true,

			},
			internet: {
				onlineBackup: false
			},
			view: {
				eventsOnlyToLeaves: false,
				userSelectedEventsShow: false,
				userSelectedEvents: [],
			}
		}
	};
}

function resetProgramState() {
	appData = getInitialDataObject();
	return writeToDiskIfNeeded(null, 'Ohjelma palautettu tehdasasetuksiin ja tyhjennetty datasta!');

}

function createFileIfNotExist() {
	var notExist = false;
	try {
		var stats = fs.statSync(file);
	} catch (e) {
		notExist = true;
		try {
			fs.createFileSync(file);
			fs.writeJsonSync(file, getInitialDataObject());			
		} catch (err) {
			console.error(err);
			throw err;
		}

	}
	// FFor now just write each time from fresh
	//fs.writeJsonSync(file, getInitialDataObject());
	return notExist;
}

function loadToMemory() {
	//fs.createFileSync(file);
	try {
		var data = fs.readJsonSync(file);
	} catch(err) {
		console.error(err);
		throw err;
	}
	
	appData = data;
	
	if (!changeCbDisabled) {
		setTimeout(function() {
			changeCb(appData);
		}, 0);		
	}	


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

function writeToDiskIfNeeded(noChangeCbCall, successMsg) {
	console.log("APP DATA NOW");
	//console.log(JSON.stringify(appData));
	if (!changeCbDisabled && !noChangeCbCall) {
		setTimeout(function() {
			changeCb(appData);
		}, 0);		
	}

	return new Promise(function(resolve, reject) {
		if (appData.settings.data.writeToDiskAfterEveryUpdate) {
			pushToDB(appData, function(err) {
				if (err) reject({type: 'danger', msg: 'Levylle kirjoittamisessa tapahtui virhe.', priv: err});
				else resolve(successMsg);
			});
		} else {
			resolve(successMsg);
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
	console.log("Overwriting old settings data with new!");
	//console.log(currTraversing);
	currTraversing[last] = data;
	return writeToDiskIfNeeded(true, "Asetukset päivitetty.");
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


	// Hunt down the parent
	_.each(pathParts, function(part) {
		var found = false;
		for(var i = 0, j = currentChildren.length; i < j; i++) {

			var child = currentChildren[i];
			if (parseInt(child.id) === parseInt(part)) {
				// Found next level
				currentChildren = child.children;
				found = true;
				break;
			}
		}

		if (!found) {
			console.error("Child not found in modifySchemitem");
			throw 'Child not found in modifySchemaItem';
		}

		
	});

	// Find the parent now
	var theItem;
	for(var i = 0, j = currentChildren.length; i < j; i++) {
		if (parseInt(currentChildren[i].id) === parseInt(last)) {
			theItem = currentChildren[i];
			break;
		}
	}
	
	if (!theItem) {
		console.error('Final child not found in modifySchemaItem');
		throw 'Final child not found in modifySchemaItem';
	}

	if (parseInt(theItem.id) !== parseInt(updatedSchemaItem.id)) {
		console.error('ID Mismatch in modifySchemitem: ' + theItem.id + " vs. " + updatedSchemaItem.id)
		throw 'ID Mismatch in modifySchemitem: ' + theItem.id + " vs. " + updatedSchemaItem.id;
	}
	// We dont allow mass assigment edit
	// Instead edit field by field
	theItem.name = updatedSchemaItem.name;
	theItem.color = updatedSchemaItem.color;

	//console.log(JSON.stringify(appData));

	return writeToDiskIfNeeded(null, "Aktiviteetin tietoja muutettu!");

}

function removeSignalEvents(signalID) {
	var events = _.filter(appData.events, function(event) {
		return !(event.signal && event.s === signalID);
	});

	appData.events = events;
}

function checkSignalItemNameClash(name) {
	var i = _.findIndex(appData.signals, function(signal) {
		return signal.name === name;
	});

	return i !== -1;
}

function addSignalItem(name, daygoal) {

	if (checkSignalItemNameClash(name)) return Promise.reject('Signaalin nimi on jo käytössä: ' + name);

	var signalItemData = {
		name: name,
		daygoal: daygoal,
		id: generateSchemaID()
	}

	appData.signals.push(signalItemData);
	return writeToDiskIfNeeded(null, "Uusi signaali luotu järjestelmään.");

}

function deleteSignalItem(id) {

	var i = _.findIndex(appData.signals, function(signal) {
		return signal.id === id;
	});

	if (i === -1) return Promise.reject('Signal item deletion failed - item not found');

	// Remove events wit this signal id
	removeSignalEvents(id);
	// Remove signal item
	appData.signals.splice(i, 1);
	return writeToDiskIfNeeded();
}

function ensureSignalIDExists(id) {
	id = parseInt(id);
	var i = _.findIndex(appData.signals, function(signal) {
		return signal.id === id;
	});

	return i !== -1;
}

function ensureSchemaIDExists(id) {
	id = parseInt(id);
	var found = false;
	var firstLevelArray = appData.schema['_root_'];
	var searchSubtree = function(branch) {
		if (found) return;
		if (parseInt(branch.id) === id) {
			found = true;
		} 

		if (branch.hasOwnProperty('children') && branch.children && branch.children.length > 0) {
			_.each(branch.children, searchSubtree);
		}

	}
	_.each(firstLevelArray, searchSubtree);
	console.log("ensureSchemaIDExists: " + found);
	return found;
}

function getSchemaItemIfExists(id) {
	id = parseInt(id);
	var found = null;
	var firstLevelArray = appData.schema['_root_'];
	var searchSubtree = function(branch) {
		if (found) return;
		if (parseInt(branch.id) === id) {
			found = branch;
		} 

		if (branch.hasOwnProperty('children') && branch.children && branch.children.length > 0) {
			_.each(branch.children, searchSubtree);
		}

	}
	_.each(firstLevelArray, searchSubtree);
	console.log("getSchemaItemIfExists: " + found);
	return found;
}

function addSignalEvent(eventData) {
	// Here we do the "fivecation"
	// This is done because allows easier adding of "artificial events" in transforms
	// For example, overlapping can not happen as long as artificials use 0 and 9 as last digit.
	var t = eventData.t + "";
	t = t.substring(0, t.length-1);
	eventData.t = parseInt(t + "5");

	if (parseInt(eventData.s) !== 0 && !ensureSignalIDExists(parseInt(eventData.s))) {
		return Promise.reject('Signaalitapahtuman luonti epäonnistui! Signaalia ei löytynyt.');
	}

	appData.events.push(eventData);

	// If we need to inform some web API event hook this would be pretty good place to do it

	return writeToDiskIfNeeded(null, 'Uusi signaalitapahtuma lisätty aikajanalle!');

}

function addEvent(eventData) {
	// Here we do the "fivecation"
	// This is done because allows easier adding of "artificial events" in transforms
	// For example, overlapping can not happen as long as artificials use 0 and 9 as last digit.
	var t = eventData.t + "";
	t = t.substring(0, t.length-1);
	eventData.t = parseInt(t + "5");

	if (parseInt(eventData.s) !== 0 && !ensureSchemaIDExists(parseInt(eventData.s))) {
		return Promise.reject('New event fail! Schema ID does not exist in datalayer!');
	}

	appData.events.push(eventData);

	// If we need to inform some web API event hook this would be pretty good place to do it

	return writeToDiskIfNeeded();

}

function addSchemaItem(pathParts, schemaData) {
	// ID generation for new schema item!
	pathParts.shift(); // Remove first which is 'schema'
	var currentChildren = appData.schema['_root_'];
	var last = pathParts.pop();
	//console.log(pathParts);

	// Hunt down the parent
	_.each(pathParts, function(part) {
		console.log("Current children");
		//console.log(JSON.stringify(currentChildren));
		var found = false;
		for(var i = 0, j = currentChildren.length; i < j; i++) {

			//console.log(currentChildren[i]);
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
	//console.log(JSON.stringify(appData));

	return writeToDiskIfNeeded();

}

function deleteSchemaItem(pathParts, schemaData) {
	// Unsupported as of now
	console.error("Deleting schema items currently unsupported - this may change in future versions of Aikavahti");
	return Promise.reject('Schema items can not be deleted - unsupported operation');

}

function deleteEvent(data) {
	var schemaID = parseInt(data.s);
	var timestamp = parseInt(data.t);

	// We just have to find it and splice
	var events = appData.events;

	var i = _.findIndex(events, function(event) {
		return parseInt(event.t) === timestamp && parseInt(event.s) === schemaID;
	});

	if (i === -1) {
		return Promise.reject('Event not found and could not be deleted!');
	}

	events.splice(i, 1); // Deletion
	return writeToDiskIfNeeded();

}

function modifyOneSetting(path, newValue) {
	var parts = path.split('.');
	var last  = parts.pop();
	var currTraversing = appData;
	_.each(parts, function(part) {
		currTraversing = currTraversing[part];
	});	
	console.log("Overwriting old settings data with new!");
	//console.log(currTraversing);
	console.log(currTraversing);
	currTraversing[last] = newValue;

	return writeToDiskIfNeeded(true);
}

function recolorSchema() {
	console.warn("DATA LAYER: Recoloring...");
	colorAssigner(appData.schema['_root_']);
			console.error("DATA TREE IN READY");
	console.log(appData.schema['_root_']);
	console.log(JSON.stringify(appData.schema['_root_']));
	return writeToDiskIfNeeded();

}

function updateSchemaItem(data) {
	console.warn("UPDATING SCHEMA ITEM IN DATA LAYER");
	console.log(data);
	var id = data.id;
	var fields = data.fields;

	var name = fields.name;
	var color = fields.color;
	var daygoal = fields.daygoal;

	var item = getSchemaItemIfExists(id);

	if (!item) {
		return Promise.reject('Schema item not found with ID: ' + id);
	}

	var clonedItem = _.assign({}, item);
	clonedItem.color = color ? color : clonedItem.color;
	clonedItem.name = name ? name : clonedItem.name;
	clonedItem.daygoal = daygoal ? daygoal : clonedItem.daygoal;

	console.log("Changed schema item clone: " + JSON.stringify(clonedItem));

	var err = dataSchema.validateSchemaItem(clonedItem);

	if (err) {
		console.error(err);
		return Promise.reject(err);
	}
	// No errors so update real schema object
	item.color = color ? color : item.color;
	item.name  = name ? name : item.name;
	item.daygoal = daygoal ? daygoal : item.daygoal;

	return writeToDiskIfNeeded();

}

function importFromFile(file) {
	try {
		var data = fs.readJsonSync(file);
		console.warn("IMPORT IMPORT IMPORT!!!!");
		console.log(data);
	} catch(e) {
		console.error("IMPORT FAILURE!!!!");
		console.log(e);
		return Promise.reject('Import failed');
	}	

	if (!data.hasOwnProperty('aikavahtiTimestamp')) {
		return Promise.reject('Import failed - JSON did not contain aikavahtiTimestamp-property');
	}

	// All is fine
	appData = data.data;
	return writeToDiskIfNeeded();
}

function exportToFile(file) {
	return new Promise(function(resolve, reject) {
		console.warn("Push to EXPORT file: " + file);
		var exportData = {
			aikavahtiTimestamp: Date.now(),
			data: appData
		};
		fs.writeJson(file, exportData, function(err) {
			if (err) {
				return reject(err);
			}
			return resolve();
		});
	});	
}

function adminCommand(operation, data) {
	if (operation === 'export') {
		var file = data;
		return exportToFile(file);
	}
	else if (operation === 'import') {
		var file = data;
		return importFromFile(file);
		// This can be done sync as user is 
	} else if (operation === 'reset') {
		return resetProgramState();
	} else if ('deploy') {
		return deployRestoreFile(data);
	}
}

function updateNotes(timestamp, notes) {
	console.warn("UPDATING NOTES: " + notes + ", " + timestamp);
	notes = _.escape(notes);
	notes = _.truncate(notes, {length: 512});
	timestamp = parseInt(timestamp);

	var events = appData.events;

	var i = _.findIndex(events, function(event) {
		return parseInt(event.t) === timestamp;
	});

	if (i === -1) {
		return Promise.reject('Event not found and could not be updated!');
	}	

	events[i].notes = notes;

	return writeToDiskIfNeeded();

}

function addMainSchemaItem(name, color, daygoal) {
	var schemaData = {
		name: name,
		color: color,
		id: generateSchemaID(),
		daygoal: daygoal
	}

	appData.schema['_root_'].push(schemaData);
	return writeToDiskIfNeeded();	
}

function addSchemaItemToParent(parentID, name, color, daygoal) {
	var item = getSchemaItemIfExists(parentID);

	if (!item) {
		return Promise.reject('Creation failed! Parent schema item not found with ID: ' + id);
	}	

	if (!item.hasOwnProperty('children')) {
		item.children = [];
	}

	var schemaData = {
		name: name,
		color: color,
		id: generateSchemaID(),
		daygoal: daygoal
	}

	item.children.push(schemaData);

	return writeToDiskIfNeeded();
}

function getCurrentEventInfo() {
	if (appData.events.length === 0) {
		return Promise.reject('No current event yet - system in fresh state!');
	}

	var eventFound;
	console.warn("SEARCHING UCRREN")
	console.log(JSON.stringify(appData.events));
	var currentWinnerTime = 0;
	for (var i = appData.events.length - 1; i >= 0; i--) {
		var event = appData.events[i];
		if (!event.signal && event.t > currentWinnerTime) {
			eventFound = event;
			currentWinnerTime = event.t;
		}
	};

	if (!eventFound) return Promise.reject('Current event not found - only signals in the system!');
	console.warn("CURRENT EVENT FOUND IN DATALAYer");
	console.log(JSON.stringify(eventFound));

	var currentCopy = Object.assign({}, eventFound);

	if (parseInt(currentCopy.s) === 0) {
		currentCopy.color = POISSA_COLOR;
		currentCopy.name = '(poissa)';
	} else {
		var item = getSchemaItemIfExists(currentCopy.s);
		currentCopy.color = item.color;
		currentCopy.name  = item.name;
		currentCopy.daygoal = item.daygoal;
	}

	return Promise.resolve(currentCopy);
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
	dataQueryIn: function(dataNeeded) {
		if (dataNeeded === 'restores') {
			return listRestorePoints();
		} else if ('currentEvent') {
			return getCurrentEventInfo();
		}
	},
	// Returns promise!
	dataCommandIn: function(dataCommand) {

		if (dataCommand.opType === 'admin') {
			return adminCommand(dataCommand.op, dataCommand.data);
		}

		if (dataCommand.opType === 'savenotes') {
			return updateNotes(dataCommand.data.t, dataCommand.data.notes);
		}

		if (dataCommand.opType === 'newSchemaItem') {
			var err = dataSchema.validateSchemaItem(dataCommand.data);

			if (err) {
				console.error("SCHEMA item Validation failed in data layer dataCommandIn!");
				return Promise.reject(err);
			}

			if (dataCommand.data.parent === -1) {
				// No parent
				return addMainSchemaItem(dataCommand.data.name, dataCommand.data.color, dataCommand.data.daygoal);
			}

			return addSchemaItemToParent(dataCommand.data.parent, dataCommand.data.name, dataCommand.data.color, dataCommand.data.daygoal);
		}

		if (dataCommand.opType === 'deleteSignalItem') {
			var signalID = dataCommand.data;
			return deleteSignalItem(signalID);
		}

		if (dataCommand.opType === 'newSignalItem') {
			var name = dataCommand.name;
			name = _.escape(name);
			name = _.truncate(name, {length: 64});

			return addSignalItem(name, dataCommand.daygoal);
		}		

		if (dataCommand.opType === 'newSignal') {
			var err = dataSchema.validateEvent(dataCommand.data);

			if (err) {
				console.error("Event (signal) validation failed in data layer dataCommandIn!");
				return Promise.reject(err);
			}

			return addSignalEvent(dataCommand.data);			
		}
		/*
		dataCommand = {
			opType: change/new/delete
			treePath: 'settings.data'
			data: {...}
		}
		*/
		// do changes etc. whatever is need

		// Note that for event timestamp is already inserted!
		if (dataCommand.opType !== 'changeOne' && dataCommand.opType !== 'general' && dataCommand.opType !== 'changeSchemaItem') {
			var pathParts = dataCommand.treePath.split('.');
			var firstPath = pathParts[0];
			var err = dataSchema.validate(dataCommand.treePath, dataCommand.data);
			if (err) {

				console.error("Validation failed in data layer dataCommandIn!");
				console.log(err);
				return Promise.reject(err);
			}			
		} 
		// Data is good


		if (dataCommand.opType === 'changeSchemaItem') {
			return updateSchemaItem(dataCommand.data);

		}
		else if (dataCommand.opType === 'general') {
			if (dataCommand.data === 'recolor') {
				return recolorSchema();
			}
		}
		else if (dataCommand.opType === 'changeOne') {
			return modifyOneSetting(dataCommand.treePath, dataCommand.data);

		} else if (dataCommand.opType === 'change') {
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
		
		var didExist = createFileIfNotExist();
		loadToMemory();
		checkRestorePoints();
		//return true;
		return didExist;

	},

	disableChangeCb: function() {
		changeCbDisabled = true;
	},
	enableChangeCb: function() {
		changeCbDisabled = false;
	},
	broadcastChange: function() {
		// Force change broadcast
		changeCb(appData);
	}


}
/*
setTimeout(function() {
	pushToDB({name: 'jaakko'});
}, 1900);

setTimeout(function() {
	fetchFromDB();
}, 2500);
*/

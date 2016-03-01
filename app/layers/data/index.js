var fs = require('fs-extra'); //var fs = require('fs') 
var util = require('util');
 
var file = __dirname + '/data.json';

fs.createFileSync(file);


var data = [1,2,3,4,5];
var changeCb;

function fetchFromDB() {
	fs.readJson(file, function(err, jsonObj) {
		console.warn("READ FROM FILE");
	  console.log(jsonObj); //0.1.3 
	}); 
}

function pushToDB(jsonObj) {
	console.warn("Push to file!");
	fs.writeJson(file, jsonObj, function(err) {
		if (err) {
			console.error(err);
		}
	});

}

module.exports = {
	changeCallback: function(cb) {
		changeCb = cb;
		setTimeout(function() {
			cb(data);
		}, 1500+Math.random()*1000);

		setInterval(function() {
			console.log("Calling change callback in data layer!!");
			cb(data);
		}, 10000);

	},
	dataCommandIn: function(dataCommand) {
		// do changes etc. whatever is need

	},
	getAll: function() {
		return fullDataset();
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

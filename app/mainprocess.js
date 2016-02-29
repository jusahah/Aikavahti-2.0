import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { greet } from './hello_world/hello_world'; // code authored by you in this project
import env from './env';

var Promise = require('bluebird');
var _ = require('lodash');

var datalayer = require('./layers/data');
var transformlayer = require('./layers/transform/transform');
datalayer.changeCallback(function(allData) {
	console.log("Change in data layer -> sending data to recompute");
	console.log(allData);
	transformlayer.recompute(allData, Box.Application.getService('derivedData').cacheComputedTransform);
});

// We get jQuery from global scope
// Inject HTML templates to dom
// IN PRODUCTION put these templates straight to dom in build-time!
$('#valikkoContainer').load('views/static/valikko.html');
$('#frontContainer').load('views/mainContents/front.html');
$('#adminContainer').load('views/mainContents/admin.html');

// Too bad these fucking loads are so async that what the hell... we need to wait a bit

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());


document.addEventListener('DOMContentLoaded', function () {
	setTimeout(function() {
		// Setting up modules
		console.log("INITING BOX CONTAINER");
		Box.Application.init({
			debug: true
		});
		console.log("BOX INITED");

	}, 200);

});
// Valikko module
Box.Application.addModule('valikko', function(context) {

	console.log("INITING VALIKKO VIEW MODULE");
	return {

		onclick: function(event, element, elementType) {
			console.log("CLICK IN VALIKKO: " + elementType);
			if (elementType.split('-')[1] === 'route') {
				console.log("is Rouite");
				// Changing a route
				Box.Application.broadcast('routechanged', elementType);
				var linkEl = $(element);
				linkEl.addClass('active');
				linkEl.siblings().removeClass('active');

				// Start loading banner
				// View itself is responsible of hiding it when its ready
				$('#globalLoadingBanner').show();
			}

		}


	};

});	

// Main front page module
Box.Application.addModule('front', function(context) {

	console.log("INITING FRONT VIEW MODULE");
	var isHidden = true;
	var $el = $(context.getElement());

	var dataNeeded = [];
	// Private stuff

	var deactivate = function() {
		if (!isHidden) {
			isHidden = true;
			$(context.getElement()).hide();
		}
	}

	var activate = function() {
		console.log("Activate fron");
		var derivedService  = context.getService('derivedData');
		var viewDataPromise = derivedService.getDeriveds(dataNeeded);
		isHidden = false;

		viewDataPromise.then(function(viewData) {
			if (isHidden) return; // User already switched to another view			

			// viewData is always object with transforNames being keys and data being values
			$('#globalLoadingBanner').hide();
			$el.empty().append("<h3>Front</h3>");
			$el.show();
		});
		

	}

	

	// Public API
	return {
		messages: ['routechanged'],
		onclick: function(event, element, elementType) {
			console.log("CLICK IN VALIKKO");
		},
		onmessage: function(name, data) {
			if (name === 'routechanged') {
				if (data.split('-')[0] === 'front') {
					activate();
				} else {
					deactivate();
				}
			}
		}


	};

});	

// Admin page module
Box.Application.addModule('admin', function(context) {
	console.log("INITING ADMIN VIEW MODULE");
	var isHidden = true;
	var $el = $(context.getElement());

	var dataNeeded = ['plusTwo', 'timesThree'];

	// Private stuff

	var deactivate = function() {
		if (!isHidden) {
			isHidden = true;
			$el.hide();
		}
	}

	var activate = function() {
		var derivedService  = context.getService('derivedData');
		var viewDataPromise = derivedService.getDeriveds(dataNeeded);
		isHidden = false;

		viewDataPromise.then(function(viewData) {
			if (isHidden) return; // User already switched to another view			
			console.log("View data");
			console.log(viewData);

			//var dataObj = context.getService('derivedData').easify(viewData);			
			// viewData is always object with transforNames being keys and data being values
			$('#globalLoadingBanner').hide();
			$el.empty().append("<h3>" + viewData['timesThree'].join(", ") + "</h3>");
			$el.show();
		});
		



	}

	

	// Public API
	return {
		messages: ['routechanged'],
		onclick: function(event, element, elementType) {
			console.log("CLICK IN VALIKKO");
		},
		onmessage: function(name, data) {
			if (name === 'routechanged') {
				if (data.split('-')[0] === 'admin') {
					activate();
				} else {
					deactivate();
				}
			}
		}


	};

});

Box.Application.addService('derivedData', function(application) {

	var cache = {}; // name -> data
	var cacheWaitingList = {}; // name -> array of waiters

	return {
		// Must return Promise!!!
		getDerived: function(transformName) {
			// First check that we have a cache slow for this name
			// Then check if its filled already
			// If yes, just return resolved Promise
			// If not, then return promise and add it to slot's waiting list
			var prom = new Promise(function(resolve, reject) {
				setTimeout(function() {
					var ret = {};
					ret[transformName] = [1,2,3,4,5];
					resolve(ret);
				}, 500+Math.random()*1500);

			});

			return prom;
		},
		// Must return Promise!!!
		getDeriveds: function(listOfTransformNames) {
			console.log("Get deriveds");
			console.log(listOfTransformNames);
			if (listOfTransformNames.length === 0) {
				//Return resolved promise
				return Promise.resolve({});
			}
			//var ret = {};
			var proms = _.map(listOfTransformNames, function(name) {
				// If item is in cache, return it straight away
				if (cache.hasOwnProperty(name)) {
					return Promise.resolve({name: name, data: cache[name]});
				}
				// Else its not yet there, so create listener
				if (!cacheWaitingList.hasOwnProperty(name)) {
					cacheWaitingList[name] = [];
				}
				
				return new Promise(function(resolve, reject) {
					cacheWaitingList[name].push(resolve);
				});
			
			});

			var promAll = Promise.all(proms);
			var promEasified = promAll.then(function(viewData) {
				return this.easify(viewData);
			}.bind(this));
			return promEasified;

			/*

			var prom = new Promise(function(resolve, reject) {
				setTimeout(function() {
					var ret = {};
					_.each(listOfTransformNames, function(name) {
						ret[name] = [1,2,3,4,5];
					});
					resolve(ret);
				}, 200+Math.random()*800);

			});

			return prom;
			*/
		},
		easify: function(viewDataArray) {
			//array -> object with transformNames as keys
			var o = {};
			_.each(viewDataArray, function(item) {
				o[item.name] = item.data;
			});
			return o;
		},
		cacheComputedTransform: function(name, results) {
			console.log("Cache computed transform in derivedData Service");
			cache[name] = results;
			console.log("Cache now");
			console.log(JSON.stringify(cache));
			if (cacheWaitingList.hasOwnProperty(name)) {
				var waiters = cacheWaitingList[name];
				_.each(waiters, function(waiter) {
					waiter(results);
				});
			}

			cacheWaitingList[name] = null;
			delete cacheWaitingList[name];
		},
		flush: function() {

		}
	}
});



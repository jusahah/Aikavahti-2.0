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
	Box.Application.getService('derivedData').flush();
	Box.Application.broadcast('computationprogressupdate', 0);
	transformlayer.recompute(allData, Box.Application.getService('derivedData').cacheComputedTransform);

});

// We get jQuery from global scope
// Inject HTML templates to dom
// IN PRODUCTION put these templates straight to dom in build-time!
$('#valikkoContainer').load('views/static/valikko.html');
$('#frontContainer').load('views/mainContents/front.html');
$('#adminContainer').load('views/mainContents/admin.html');

// View module registrations
require('./viewmodules/admin')(Box); // Send Box in so view modules can bind themselves into it
require('./viewmodules/front')(Box); // Same here

// Service registrations
require('./services/derivedData')(Box);


// Too bad these fucking loads are so async that what the hell... we need to wait a bit

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());


document.addEventListener('DOMContentLoaded', function () {
	setTimeout(function() {
		// Setting up modules
		console.log("INITING BOX CONTAINER");
		// Note that modules and all other stuff must registered by this moment
		Box.Application.init({
			debug: true
		});
		console.log("BOX INITED");

	}, 200);

});
// Valikko module
// This is special view module in that its always visible and it controls other modules
Box.Application.addModule('valikko', function(context) {

	var current;
	var $el = $(context.getElement());
	var computeProgressBar = $el.find('#computeprogressbar');

	var reshowCurrentView = function() {
		if (current) {
			Box.Application.broadcast('routechanged', current);
			$('#globalLoadingBanner').show();
		}
	}

	var updateProgressBar = function(percentageDone) {
		computeProgressBar.css('width', percentageDone + "%");
		computeProgressBar.empty().append(percentageDone + "%");
	}

	console.log("INITING VALIKKO VIEW MODULE");
	return {
		messages: ['cachewasflushed', 'computationprogressupdate'],
		onclick: function(event, element, elementType) {
			console.log("CLICK IN VALIKKO: " + elementType);
			if (elementType.split('-')[1] === 'route') {
				console.log("Route change clicked");
				// Changing a route
				Box.Application.broadcast('routechanged', elementType);
				current = elementType;
				var linkEl = $(element);
				linkEl.addClass('active');
				linkEl.siblings().removeClass('active');

				// Start loading banner
				// View itself is responsible of hiding it when its ready
				$('#globalLoadingBanner').show();
			}

		},
		onmessage: function(name, data) {
			if (name === 'cachewasflushed') {
				console.warn("CACHE FLUSH CAUGHT IN VALIKKO MODULE");
				reshowCurrentView();
			} else if (name === 'computationprogressupdate') {
				console.warn("Progress update in valikko");
				console.log(data);
				updateProgressBar(data);
			}
		}


	};

});	









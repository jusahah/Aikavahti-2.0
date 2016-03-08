import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { greet } from './hello_world/hello_world'; // code authored by you in this project
import env from './env';

var Promise = require('bluebird');
var _ = require('lodash');

var datalayer = require('./layers/data');
var transformlayer = require('./layers/transform/transform');
datalayer.init();
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
$('#schemaviewerContainer').load('views/mainContents/schemaviewer.html');
$('#settingsContainer').load('views/mainContents/settings.html');
$('#manageContainer').load('views/mainContents/manage.html');

// View module registrations
require('./viewmodules/admin')(Box); // Send Box in so view modules can bind themselves into it
require('./viewmodules/front')(Box); // Same here
require('./viewmodules/schemaViewer')(Box); // Same
require('./viewmodules/settings')(Box); // Same
require('./viewmodules/manage')(Box); // Same
// Service registrations
require('./services/derivedData')(Box, datalayer);
require('./services/settingsService')(Box, datalayer);
require('./services/eventService')(Box, datalayer);

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
// It also governs most of the always-visible stuff on the site
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
				console.log("EL TYPE: " + elementType);
				current = elementType;
				var linkEl = $(element);
				linkEl.addClass('active');
				linkEl.siblings().removeClass('active');

				// Start loading banner
				// View itself is responsible of hiding it when its ready
				$('#globalLoadingBanner').show();
			} else if (elementType === 'forceflush') {
				console.warn("Artificial cache flush");
				context.getService('derivedData').forceDataRecomputation();
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
			} else if (name === 'newacticity_showall') {
				var ss = context.getService('settingsService');
				

			}
		}


	};

});	


// Start tests
setTimeout(function() {
	datalayer.dataCommandIn({
		opType: 'change',
		treePath: 'settings.data',
		data: {
			writeToDiskAfterEveryUpdate: false
		}
	})
}, 1000);


setTimeout(function() {
	datalayer.dataCommandIn({
		opType: 'change',
		treePath: 'settings.data',
		data: {
			writeToDiskAfterEveryUpdate: true
		}
	})
}, 4000);

setTimeout(function() {
	console.group();
	datalayer.dataCommandIn({
		opType: 'new',
		treePath: 'schema.1.11',
		data: {
			name: 'PHP',
			color: '6611ff'
		}
	})
	console.groupEnd();
}, 1200);

setTimeout(function() {
	console.group();
	datalayer.dataCommandIn({
		opType: 'change',
		treePath: 'schema.1.12',
		data: {
			id: 12,
			name: 'Web coding',
			color: '6611ff'
		}
	});
	console.groupEnd();
}, 1400);


setTimeout(function() {
	datalayer.disableChangeCb();
	var ids = [1,2,3,11,12];
	for (var i = 50; i >= 0; i--) {
		console.group();
		var id = ids[Math.floor(ids.length*Math.random())];
		datalayer.dataCommandIn({
			opType: 'new',
			treePath: 'events',
			data: {
				t: Date.now() - Math.floor(Math.random()* 1000 * 3600 * 28),
				s: id
			}
		});
		console.groupEnd();		
	};

	datalayer.enableChangeCb();

}, 1600);

setTimeout(function() {
	datalayer.broadcastChange();
}, 2800);



// Admin page module
var _ = require('lodash');
var tinycolor = require('tinycolor2');
var moment = require('moment');

module.exports = function(Box) {

	Box.Application.addModule('manage', function(context) {
		console.log("INITING SETTINGS VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = ['eventList', 'schemaTree'];

		var showLast30 = true;

		// Private stuff

		var deactivate = function() {
			showLast30 = true;
			if (!isHidden) {
				isHidden = true;
				$el.hide();
			}
		}

		var activate = function(preventHide) {
			// hide right away in case we are reactivating view that is currently visible
			if (!preventHide) $el.hide();			
			console.log("Activate in manage module");
			var derivedService  = context.getService('derivedData');
			var viewDataPromise = derivedService.getDeriveds(dataNeeded);
			isHidden = false;

			viewDataPromise.then(function(viewData) {
				if (isHidden) return; // User already switched to another view			

				// viewData is always object with transforNames being keys and data being values
				$('#globalLoadingBanner').hide();
				//$el.empty().append("<h3>" + JSON.stringify(viewData) + "</h3>");
				bindToView(viewData.eventList, viewData.schemaTree);
				$el.show();
			});
			

		}


		var bindToView = function(eventList, schemaTree) {
			//$el.empty().append(JSON.stringify(eventList));
			$body = $el.find('#managetimeline_body');
			var html = '';

			// Filter event list
			if (showLast30) {
				var timestamp = moment().subtract(30, 'days').valueOf();
				eventList = _.takeWhile(eventList, function(event) {
					return event.t > timestamp;
				});
			}

			_.each(eventList, function(eventWithSchemaData) {
				var color = eventWithSchemaData.color || '554455';
				var tc = tinycolor(color);
				var textcolor = tc.isDark() ? 'fff' : '222'; 
				html += '<tr>';
				html += '<td style="color: #' + textcolor+ '; background-color: #' + color + ';">' + eventWithSchemaData.name + '</td>';
				html += '<td>' + beautifyTimestamp(eventWithSchemaData.t) + '</td>';
				html += '<td>' + dateString(eventWithSchemaData.t) + '</td>';
				html += '<td>' + teaserOfNotes(eventWithSchemaData.notes) + '</td>';
				html += '<td><a data-notes="' +eventWithSchemaData.notes+ '" data-type="deleteactivity" data-payload="' + eventWithSchemaData.t + '_' + eventWithSchemaData.s + '" class="btn btn-danger">Poista</a></td>';
				html += '</tr>';
			});

			$body.empty().append(html);


			// Add activity part

			$select = $el.find('#activitytoadd');
			$select.empty().append(buildHTMLFromTree(schemaTree));


		}

		function buildHTMLFromTree(schemaTree) {
			var baseMargin = 0;
			var html = '';
			var depth = 1;

			html = buildSubtree(schemaTree, depth);

			return html;


		}

		function buildSubtree(schemaTree, depth) {

			var subHTML = '';

			if (schemaTree && schemaTree.length !== 0) {
				_.each(schemaTree, function(branch) {
					console.log("BRANCH: " + branch.name + " with depth " + depth);
					subHTML += createOneElement(branch, depth);
					//subHTML += buildUnspecified(branch.hisOwnTotals, branch.color, depth+1);
					if (branch.hasOwnProperty('children')) {
						subHTML += buildSubtree(branch.children, depth+1);
					}
					
				});

			};

			return subHTML;
		}

		function createOneElement(schemaItem, depth) {

			depth = depth < 1 ? depth : depth - 1;

			return "<option value='" + schemaItem.id + "'>" + _.repeat('...', depth) + schemaItem.name + "</option>";
		}


		var beautifyTimestamp = function(timestamp) {
			var d = new Date(timestamp);
			var tunnit = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
			var mins   = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();

			return tunnit + "." + mins;
		}

		var dateString = function(timestamp) {
			var d = moment(timestamp);
			return d.format('MMMM Do YYYY');

		}

		var teaserOfNotes = function(notes) {
			var notes = notes || '';
			return _.truncate(notes, {'length': 16});

		}


		var gatherAndAddActivity = function() {
			var date = $el.find('#activitydate').val();
			var time = $el.find('#activitytime').val();
			var activityID = $el.find('#activitytoadd').val();

			var es = context.getService('eventService');
			es.newEventCustomDateTime(date, time, activityID);
		}

		var sendDeleteRequestForEvent = function(timestampPlusSchemaID) {

			var parts = timestampPlusSchemaID.split('_');
			var ts = parts[0];
			var schemaID = parts[1];

			var es = context.getService('eventService');
			es.deleteEvent(ts, schemaID);			

		}

		var reloadTable = function() {
			activate(true);
		}

		

		// Public API
		return {
			messages: ['routechanged'],
			onclick: function(event, element, elementType) {
				event.preventDefault();
				console.error("EVENT TARGET");
				console.error(event.target);
				console.log("CLICK IN manage");

				if (elementType === 'addactivity') gatherAndAddActivity();
				else if (elementType === 'deleteactivity') {
					var timestampPlusSchemaID = $(element).data('payload');
					sendDeleteRequestForEvent(timestampPlusSchemaID);
				} else if(elementType === 'activities_showall') {
					showLast30 = false;
					reloadTable();
				} else if (elementType === 'activities_show30') {
					showLast30 = true;
					reloadTable();
				}
			},
			onmessage: function(name, data) {
				console.log("ON MESSAGE IN manage");
				if (name === 'routechanged') {
					var route = data.route;
					if (route.split('-')[0] === 'manage') {
						console.log("CAUGHT IN manage");

						activate();
					} else {
						deactivate();
					}
				} 
				
			}


		};

	});

}

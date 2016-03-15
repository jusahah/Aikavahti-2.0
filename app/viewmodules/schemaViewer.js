// Admin page module
var _ = require('lodash');
var moment = require('moment');
var tinycolor = require('tinycolor2');

module.exports = function(Box) {

	Box.Application.addModule('schemaviewer', function(context) {
		console.log("INITING SCHEMA VIEWER VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = ['eventList', 'schemaTree', 'schemaItems'];

		var viewDataCached;

		var INNERPADDING = 16;

		// Private stuff

		var deactivate = function() {
			if (!isHidden) {
				isHidden = true;
				$el.hide();
			}
		}

		var activate = function() {
			// hide right away in case we are reactivating view that is currently visible
			$el.hide();
			var derivedService  = context.getService('derivedData');
			var viewDataPromise = derivedService.getDeriveds(dataNeeded);
			isHidden = false;

			viewDataPromise.then(function(viewData) {
				if (isHidden) return; // User already switched to another view			
				console.log("View data");
				console.log(viewData);

				viewDataCached = viewData;

				//var dataObj = context.getService('derivedData').easify(viewData);			
				// viewData is always object with transforNames being keys and data being values
				$('#globalLoadingBanner').hide();
				//$el.empty().append(JSON.stringify(viewData));
				$el.find('#schematable_body').empty().append(buildHTMLFromTree(viewData.schemaTree));
				$el.show();
			});
			
		}

/*
		function buildHTMLFromTree(coloredTree) {
			var baseMargin = 0;
			var html = '';
			var depth = 1;

			html = buildSubtree(coloredTree, depth);

			return html;


		}

		function buildSubtree(coloredTree, depth) {

			var subHTML = '';

			if (coloredTree && coloredTree.length !== 0) {
				_.each(coloredTree, function(branch) {
					console.log("BRANCH: " + branch.name + " with depth " + depth);
					subHTML += createOneElement(branch.name, branch.totalTime, branch.color, depth);
					subHTML += buildUnspecified(branch.hisOwnTotals, branch.color, depth+1);
					if (branch.hasOwnProperty('children')) {
						subHTML += buildSubtree(branch.children, depth+1);
					}
					
				});

			};

			return subHTML;
		}

		function buildUnspecified(ownTotals, color, depth) {
			var beautifiedTime = beautifyTime(ownTotals);
			return "<div style='background-color: #" + color + "; margin-left: " + (depth * 20) + "px';> (unspecified) | " + beautifiedTime + "</div>";
		}
		

		function createOneElement(name, totals, color, depth) {
			var beautifiedTime = beautifyTime(totals);
			return "<div style='background-color: #" + color + "; margin-left: " + (depth * 20) + "px';>" + name + " | " + beautifiedTime + "</div>";
		}
*/

		function buildHTMLFromTree(coloredTree) {
			var baseMargin = 0;
			var html = '';
			var depth = 1;

			html = buildSubtree(coloredTree, depth);

			return html;


		}

		function buildSubtree(coloredTree, depth) {

			var subHTML = '';

			if (coloredTree && coloredTree.length !== 0) {
				_.each(coloredTree, function(branch) {
					console.log("BRANCH: " + branch.name + " with depth " + depth);
		
					subHTML += createOneElement(branch.id, branch.name, branch.color, depth);
					//subHTML += createOneElement(branch.id, '(' + branch.name + ')', branch.hisOwnTotals, branch.color, depth+1);						
					

					if (branch.hasOwnProperty('children')) {
						subHTML += buildSubtree(branch.children, depth+1);
					}
					
				});

			};

			return subHTML;
		}

		function buildUnspecified(ownTotals, color, depth) {
			var beautifiedTime = beautifyTime(ownTotals);
			return "<div style='background-color: #" + color + "; margin-left: " + (depth * 20) + "px';> (unspecified) | " + beautifiedTime + "</div>";
		}
		
		/*
		function createOneElement(name, totals, color, depth) {
			var beautifiedTime = beautifyTime(totals);
			
			return "<div style='background-color: #" + color + "; margin-left: " + (depth * 20) + "px';>" + name + " | " + beautifiedTime + "</div>";
		}
	*/
		function createOneElement(id, name, color, depth) {

			var html = "<tr>"
			var padding = depth*INNERPADDING;
			color = color || '554455';
			if (color.charAt(0) === '#') {
				color = color.substr(1);
			}			
			var tc = tinycolor(color);
			var textcolor = tc.isDark() ? 'fff' : '222'; 
			var ownText = name;		
			html += "<td style='padding-left:" + padding + "px;'><button data-type='schemaItemInSchemaViewer' data-payload='" + id + "_" + ownText + "' class='btn' style='width: 100%; text-align: left; background-color: #" + color + "; color: #" + textcolor+ ";'>" + name + "</button></td>";
			html += "<td><button data-type='addAsSubgroup' data-payload='" + id + "' class='btn btn-default' data-toggle='modal' data-target='#addsubgroupModal'>Uusi alaryhmä</td>";
			html += "<td><button data-type='editSchemaItem' data-payload='" + id + "' class='btn btn-warning' data-toggle='modal' data-target='#schemaItemModal'>Väritä</td>";
			html += "<td><button data-type='editSchemaItemName' data-payload='" + id + "' class='btn btn-danger' data-toggle='modal' data-target='#editSchemaItemNameModal'>Muokkaa</td>";			
			html += "<td><button data-type='showEventHistory' data-payload='" + id + "' class='btn btn-primary' data-toggle='modal' data-target='#eventHistory'>Selaa</td>";
			html += "</tr>";
			return html;
		}

		function beautifyTime(timeInMs) {
			if (timeInMs === 0) return "---";
			var secs = Math.floor(timeInMs / 1000);
			if (secs < 60) return '< 1 min';
			var mins = Math.floor(secs / 60);
			if (mins < 60) return mins + " minuuttia";
			var hours = Math.floor(mins / 60);
			var leftMins = mins % 60;
			if (leftMins === 0) return hours + " tuntia";
			return hours + " tuntia " + leftMins + " minuuttia";
		}

		function recolorRequest() {
			var ss = context.getService('settingsService');
			ss.recolorSchema();
		}

		function loadEditSchemaItemModal(schemaID) {
			var modalBody = $el.find('#schemaItemModalBody');
			var inputColor = modalBody.find('#pickschemecolor');
			var saveButton = $el.find('#saveSchemaItemChanges');
			var schemaItem = viewDataCached.schemaItems[schemaID];
			console.warn("FILLING EDIT SCHEMA ITEM MODAL!: " + schemaItem.color);
			inputColor.spectrum('set', '#' + schemaItem.color);
			saveButton.data('payload', schemaID);
		}

		function gatherAndSaveSchemaChanges(schemaID) {
			var modalBody = $el.find('#schemaItemModalBody');
			var inputColor = modalBody.find('#pickschemecolor');
			var color = inputColor.spectrum('get');
			console.log("COLOR NOW");
			console.log(color);
			console.log(color.toHexString());
			var ss = context.getService('settingsService');
			ss.updateSchemaItem(schemaID, {
				color: color.toHexString().substr(1) // Drop the leading #
			});
		}

		function addAsSubgroup(schemaID) {
			console.log("OPENING ADD SUBGROUP MODAL: " + schemaID);
			var modal = $el.find('#addsubgroupModal');
			modal.data('schemaid', schemaID);
			var schemaItem = viewDataCached.schemaItems[schemaID];
			modal.find('#supergroupname').empty().append(schemaItem.name);


		}

		function gatherSubgroupCreate() {
			var modal = $el.find('#addsubgroupModal');
			var schemaID = modal.data('schemaid');

			if (!schemaID || schemaID === '') {
				console.error('Schema creation fail - no parent group ID');
				return;
			}

			var name = modal.find('#activityname_el').val();

			if (!name || name === '') {
				console.error('Schema creation fail - no name');
				return;
			}

			var ss = context.getService('settingsService');
			var prom = ss.createSchemaItem(schemaID, name);


		}

		function resolveFullHours(timeInMs) {
			return Math.floor(timeInMs / (3600 * 1000));
		}

		function resolveLeftMins(timeInMs) {
			var hours = resolveFullHours(timeInMs);
			return Math.round((timeInMs - (hours * 3600 * 1000)) / (60 * 1000));
		}

		function populateEditNameModal(schemaID) {
			console.log("Populating edit name modal: " + schemaID);
			var item = viewDataCached.schemaItems[schemaID];
			if (item.daygoal && item.daygoal !== '' && item.daygoal !== '0') {
				var parts = item.daygoal.split('_');
				$el.find('#schemaitemcomp_el').val(parts[0]);
				$el.find('#schemaitemboundaryhours_el').val(resolveFullHours(parseInt(parts[1])));
				$el.find('#schemaitemboundarymins_el').val(resolveLeftMins(parseInt(parts[1])));				
			} else {
				$el.find('#schemaitemcomp_el').val('dd');
				$el.find('#schemaitemboundaryhours_el').val(0);
				$el.find('#schemaitemboundarymins_el').val(0);					
			}

			$el.find('#newschemaitemname_el').val(item.name);
			$el.find('#editSchemaItemNameModal').data('schemaid', schemaID);
			
		}

		function resolveHoursAndMins(hours, mins) {
			hours = parseInt(hours);
			if (isNaN(hours)) hours = 0;
			mins = parseInt(mins);
			if (isNaN(mins)) mins = 0;
			return hours * 3600 * 1000 + mins * 60 * 1000;
		}

		function gatherAndSendEditSchemaName() {
			// Now also edits daily goal stuff
			var goalTypes = ['lt', 'le', 'gt', 'le'];
			var schemaID = $el.find('#editSchemaItemNameModal').data('schemaid');
			if (!schemaID || schemaID == '0') {
				return;
			}
			console.warn("Updating schema item name");
			var newName = $el.find('#newschemaitemname_el').val();
			var goalType = $el.find('#schemaitemcomp_el').val();
			var goalHours  = $el.find('#schemaitemboundaryhours_el').val();
			var goalMins  = $el.find('#schemaitemboundarymins_el').val();

			var timeInMs = resolveHoursAndMins(goalHours, goalMins);
			var daygoalString = goalTypes.indexOf(goalType) === -1 ? '0' : goalType + '_' + timeInMs;
			console.log("New name: " + newName);
			console.log("New daily goal: " + daygoalString);
			var ss = context.getService('settingsService');
			ss.updateSchemaItem(schemaID, {name: newName, daygoal: daygoalString});

		}

		function showNewMainGroupModal() {
			// well how embarrasing... this is actually no-op as modal needs no dynamic data

		}

		function gatherAndSendMainGroup() {
			var name = $el.find('#main_activityname_el').val();
			if (!name || name === '') {
				console.error('Schema main group creation fail - no name');
				return;
			}

			var ss = context.getService('settingsService');	
			var prom = ss.createMainSchemaItem(name);		

		}

		function timeStringToNote(timestamp) {
			return moment(timestamp).format('dd DD.MM.YY HH:mm');
		}


		function populateEventHistory(schemaID) {
			if (!viewDataCached) return;
			schemaID = parseInt(schemaID);
			var eventsArr = viewDataCached.eventList;
			var schemaItem = viewDataCached.schemaItems[schemaID];

			var onlyThisSchemaEventsWithNotes = _.filter(eventsArr, function(event) {
				return event.s === schemaID && event.notes;
			});

			var html = '';
			_.each(onlyThisSchemaEventsWithNotes, function(notedEvent) {
				html += '<li style="min-height: 80px;">';
				html += '<div class="smart-timeline-time">';
				html += '<small>' + timeStringToNote(notedEvent.t) + '</small>';
				html += '</div>'
				html += '<div class="smart-timeline-content">';
				html += '<p>' + notedEvent.notes + '</p>';
				html += '</div>';
				html += '</li>';				
			});

			$el.find('#notes_ul').empty().append(html);
			$el.find('#eventhistory_title').empty().append((schemaItem.name || '???') + " - muistiinpanot");

		}



		

		// Public API
		return {
			messages: ['routechanged'],
			onclick: function(event, element, elementType) {
				console.log("CLICK IN SCHEMA VIEWER");
				event.preventDefault();
				if (elementType === 'recolorschema') {
					console.warn("RECOLOR REQUEST");
					recolorRequest();
				} else if (elementType === 'editSchemaItem') {
					loadEditSchemaItemModal($(element).data('payload'));
				} else if (elementType === 'editSchemaItemName') {
					populateEditNameModal($(element).data('payload'));
				} else if (elementType === 'addAsSubgroup') {
					addAsSubgroup($(element).data('payload'));
				} else if (elementType === 'saveSchemaItemChanges') {
					console.warn("SAVING SCHEMA ITEM CHANGES: " + $(element).data('payload'));
					gatherAndSaveSchemaChanges($(element).data('payload'));
				} else if (elementType === 'createsubgroup') {
					console.warn("CREATING NEW SCHEMA ITEM");
					gatherSubgroupCreate();
				} else if (elementType === 'submitNewSchemaItemName') {
					gatherAndSendEditSchemaName();
				} else if (elementType === 'newMainGroup') {
					showNewMainGroupModal();
				} else if (elementType === 'createmaingroup') {
					gatherAndSendMainGroup();
				} else if (elementType === 'showEventHistory') {
					populateEventHistory($(element).data('payload'));
				}
			},
			onmessage: function(name, data) {
				console.log("ROUTE CHAGE RECEIVED IN schemaviewer");
				if (name === 'routechanged') {
					var route = data.route;
					if (route.split('-')[0] === 'schemaviewer') {

						activate();
					} else {
						deactivate();
					}
				} 
				
			}


		};

	});

}

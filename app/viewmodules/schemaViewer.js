// Admin page module
var _ = require('lodash');
var moment = require('moment');
var tinycolor = require('tinycolor2');

module.exports = function(Box) {

	Box.Application.addModule('schemaviewer', function(context) {
		console.log("INITING SCHEMA VIEWER VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = ['schemaTree', 'schemaItems'];

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
			html += "<td><button data-type='deleteSchemaItem' data-payload='" + id + "' class='btn btn-danger' data-toggle='modal' data-target='#deleteSchemaItemModal'>Poista</td>";			html += "</tr>";
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
				} else if (elementType === 'addAsSubgroup') {
					addAsSubgroup($(element).data('payload'));
				} else if (elementType === 'saveSchemaItemChanges') {
					console.warn("SAVING SCHEMA ITEM CHANGES: " + $(element).data('payload'));
					gatherAndSaveSchemaChanges($(element).data('payload'));
				} else if (elementType === 'createsubgroup') {
					console.warn("CREATING NEW SCHEMA ITEM");
					gatherSubgroupCreate();

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

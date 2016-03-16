// Admin page module
var _ = require('lodash');

module.exports = function(Box) {

	Box.Application.addModule('signals', function(context) {
		console.log("INITING SIGNAL VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = ['signalsTable'];

		var viewDataCached;

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

				viewDataCached = viewData;

				//var dataObj = context.getService('derivedData').easify(viewData);			
				// viewData is always object with transforNames being keys and data being values
				$('#globalLoadingBanner').hide();
				$el.find('#signalstable_body').empty().append(buildHTML(viewData.signalsTable));
				//$el.empty().append("<h3>" + JSON.stringify(viewData) + "</h3>");
				$el.show();
			});
			
		}
		var getComparisonString = function(comp) {
			if (comp === 'lt') return 'alle';
			if (comp === 'le') return 'maksimissaan';
			if (comp === 'gt') return 'enemmän kuin';
			if (comp === 'ge') return 'vähintään';
			if (comp === 'e')  return 'tasan'; 
			return '?';

		}		

		var resolveDayGoalForTable = function(daygoal) {
			if (!daygoal || daygoal === '' || daygoal == '0') return '---';

			var parts = daygoal.split('_');
			if (parts.length !== 2) return '---';
			return getComparisonString(parts[0]) + " " + parts[1] + " kpl";

		}

		var buildHTML = function(signalsTable) {

			var html = '';

			_.forOwn(signalsTable, function(signalItem) {
				 
				html += '<tr>';
				html += '<td>' + signalItem.name + '</td>';
				html += '<td>' + resolveDayGoalForTable(signalItem.daygoal) + '</td>';
				html += '<td><a data-toggle="modal" data-target="#deletesignalModal" data-type="deletesignalitem" data-payload="' + signalItem.id + '" class="btn btn-danger">Poista</a></td>';
				html += '</tr>';
			});

			return html;
		}

		var showSignalDeleteConfirm = function(signalID) {

			var signalName = viewDataCached.signalsTable[signalID].name;
			$el.find('#deletesignalModal').data('payload', signalID);
			$el.find('#deletesignalModal').find('#signalname').empty().append(signalName);


		}

		var sendSignalDeleteRequest = function(signalID) {
			var ss  = context.getService('settingsService');

			var prom = ss.deleteSignalItem(signalID);
		}

		var gatherAndSendSignalData = function() {
			var goalTypes = ['lt', 'le', 'gt', 'le', 'e'];
			var signalName = $el.find('#newsignalname_el').val();
			var signalcomp = $el.find('#signalitemcomp_el').val();
			var signalboundary = $el.find('#signalitemboundary_el').val();

			var daygoalString = goalTypes.indexOf(signalcomp) === -1 || isNaN(parseInt(signalboundary)) ? '0' : signalcomp + '_' + signalboundary;

			var ss  = context.getService('settingsService');
			var prom = ss.createSignalItem(signalName, daygoalString);

			prom.catch(function(err) {
				console.error(err);
			});

		}



		

		// Public API
		return {
			messages: ['routechanged'],
			onclick: function(event, element, elementType) {

				if (elementType === 'deletesignalitem') {
					var signalID = $(element).data('payload');
					return showSignalDeleteConfirm(signalID);
				} else if (elementType === 'confirmsignaldeletion') {
					var signalID = $el.find('#deletesignalModal').data('payload');
					if (signalID && signalID != '0') {
						return sendSignalDeleteRequest(parseInt(signalID));
					}
				} else if (elementType === 'submitNewSignal') {
					gatherAndSendSignalData();
				}
			},
			onmessage: function(name, data) {
				if (name === 'routechanged') {
					var route = data.route;
					if (route.split('-')[0] === 'signals') {

						activate();
					} else {
						deactivate();
					}
				} 
				
			}


		};

	});

}

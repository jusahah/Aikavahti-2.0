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
				console.log("View data");
				console.log(viewData);

				viewDataCached = viewData;

				//var dataObj = context.getService('derivedData').easify(viewData);			
				// viewData is always object with transforNames being keys and data being values
				$('#globalLoadingBanner').hide();
				$el.find('#signalstable_body').empty().append(buildHTML(viewData.signalsTable));
				//$el.empty().append("<h3>" + JSON.stringify(viewData) + "</h3>");
				$el.show();
			});
			
		}

		var buildHTML = function(signalsTable) {

			var html = '';

			_.forOwn(signalsTable, function(signalItem) {
				 
				html += '<tr>';
				html += '<td>' + signalItem.name + '</td>';
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
			console.warn("SIGNAL DELETE REQUEST FOR SIGNAL: " + signalID);
			var ss  = context.getService('settingsService');

			var prom = ss.deleteSignalItem(signalID);
		}

		var gatherAndSendSignalData = function() {
			console.warn("Gather and send siglan creation");
			var signalName = $el.find('#newsignalname_el').val();

			var ss  = context.getService('settingsService');
			var prom = ss.createSignalItem(signalName);

		}



		

		// Public API
		return {
			messages: ['routechanged'],
			onclick: function(event, element, elementType) {
				console.log("CLICK IN SIGNALS");

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

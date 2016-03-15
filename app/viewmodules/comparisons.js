// Admin page module
var _ = require('lodash');

module.exports = function(Box) {

	Box.Application.addModule('comparisons', function(context) {
		console.log("INITING SIGNAL VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = ['weekByWeekTable', 'monthByMonthTable', 'schemaItems', 'signalsTable', 'signalsPerWeekAndMonth'];

		var showSignals = false;
		var currentPayload = 'week';

		var viewDataCached;

		// Private stuff

		var deactivate = function() {
			if (!isHidden) {
				isHidden = true;
				$el.hide();
			}
		}

		var activate = function(noHide) {
			console.log("COMPARISONG ACTIVATING!!");
			// hide right away in case we are reactivating view that is currently visible
			if (!noHide) $el.hide();
			var derivedService  = context.getService('derivedData');
			var viewDataPromise = derivedService.getDeriveds(dataNeeded);
			isHidden = false;

			// Switch top button classes
			if (showSignals) {
				$el.find('#showActivity_b').removeClass('btn-success').addClass('btn-default');
				$el.find('#showSignals_b').removeClass('btn-default').addClass('btn-success');
			} else {
				$el.find('#showSignals_b').removeClass('btn-success').addClass('btn-default');
				$el.find('#showActivity_b').removeClass('btn-default').addClass('btn-success');				
			}

			viewDataPromise.then(function(viewData) {
				if (isHidden) return; // User already switched to another view			
				console.log("View data");
				console.log(viewData);

				viewDataCached = viewData;

				//var dataObj = context.getService('derivedData').easify(viewData);			
				// viewData is always object with transforNames being keys and data being values
				var headName = currentPayload === 'week' ? 'Viikkonumero' : 'kk. numero';
				if (showSignals) {
					$el.find('#groupnoticetext').empty();
					$el.find('#comparisons_table_head').empty().append(buildSignalsTableHead(viewData.signalsTable, viewData.signalsPerWeekAndMonth, headName));
					if (currentPayload === 'week') {
						$el.find('#comparisons_table_title').empty().append('Viikkotaulukko');
						$el.find('#comparisons_p').empty().append('Viikottainen kokonaismäärä per signaali');

						$el.find('#comparisons_table_body').empty().append(buildSignalsTableBodyWeek(viewData.signalsTable, viewData.signalsPerWeekAndMonth.week));
					} else {
						$el.find('#comparisons_table_title').empty().append('Kuukausitaulukko');
						$el.find('#comparisons_p').empty().append('Kuukausittainen kokonaismäärä per signaali');					

						$el.find('#comparisons_table_body').empty().append(buildSignalsTableBodyMonth(viewData.signalsTable, viewData.signalsPerWeekAndMonth.month));

					}

				} else {
					$el.find('#groupnoticetext').empty().append('HUOM! Ryhmäaktiviteetin kokonaisaika = jälkeläisten kokonaisajat + oma kokonaisaika.');
					$el.find('#comparisons_table_head').empty().append(buildTableHead(viewData.schemaItems, headName));
					if (currentPayload === 'week') {
						$el.find('#comparisons_table_title').empty().append('Viikkotaulukko');
						$el.find('#comparisons_p').empty().append('Viikottainen kokonaisaika per aktiviteetti');

						$el.find('#comparisons_table_body').empty().append(buildTableBodyWeek(viewData.weekByWeekTable, viewData.schemaItems));
					} else {
						$el.find('#comparisons_table_title').empty().append('Kuukausitaulukko');
						$el.find('#comparisons_p').empty().append('Kuukausittainen kokonaisaika per aktiviteetti');					

						$el.find('#comparisons_table_body').empty().append(buildTableBodyMonth(viewData.monthByMonthTable, viewData.schemaItems));

					}

				}


				$('#globalLoadingBanner').hide();
				//$el.empty().append("<h3>" + JSON.stringify(viewData) + "</h3>");
				$el.show();
			});
			
		}

		var buildSignalsTableHead = function(signalsTable, signalsPerWeekAndMonth, headName) {
			var html = '<tr><th style="width: 40px;"><strong>' + headName + '</strong></th>'; // First is empty as week name is there

			_.forOwn(signalsTable, function(item) {
				html += '<th style="padding: 2px; color: white; background-color: #776677; max-width: 48px; font-size: 8px; overflow: hidden;">' + item.name + '</th>';
			})

			html += '</tr>';
			return html;			
		}

		var buildSignalsTableBodyWeek = function(signalsTable, signalsPerWeek) {
			var itemsCount = _.keys(signalsTable).length;

			var body = '';
			var upperLimitInCount = 300; // 100

			var weeksArray = createWeeksArray(Date.now());
			console.error("STARTING TO BUILD SIGNAL TABLE FOR WEEK");


			_.each(weeksArray, function(weekString) {
				body += '<tr>';
				body += buildSignalRow(upperLimitInCount, weekString, signalsPerWeek, signalsTable, itemsCount);
				body += '</tr>';

			});
			console.error("COMPARISONG TABLE BODY (FOR WEEK)");
			console.log(body);
			return body;			
		}

		var buildSignalsTableBodyMonth = function(signalsTable, signalsPerMonth) {
			var itemsCount = _.keys(signalsTable).length;

			var body = '';
			var upperLimitInCount = 300; // 100

			var monthsArray = createMonthsArray(Date.now());
			console.error("STARTING TO BUILD SIGNAL TABLE FOR MONTH");
			console.log(monthsArray);

			_.each(monthsArray, function(monthString) {
				body += '<tr>';
				body += buildSignalRow(upperLimitInCount, monthString, signalsPerMonth, signalsTable, itemsCount);
				body += '</tr>';

			});
			console.error("COMPARISONG TABLE BODY (FOR MONTH)");
			console.log(body);
			return body;			
		}

		var buildTableHead = function(schemaItems, headName) {
			var html = '<tr><th style="width: 40px;"><strong>' + headName + '</strong></th>'; // First is empty as week name is there

			_.forOwn(schemaItems, function(item) {
				var isLeaf = !item.children || item.children.length === 0;
				var thColor = isLeaf ? '568A89' : '9D5353';
				html += '<th style="padding: 2px; color: white; background-color: #' + thColor + '; max-width: 48px; font-size: 8px; overflow: hidden;">' + item.name + '</th>';
			})

			html += '</tr>';
			return html;
		}

		var getWeekString = function(timestamp) {

			var m = moment(timestamp);
			console.log("WEEK STRING IS: " + m.isoWeekYear() + "-" + m.isoWeeks());
			return m.isoWeekYear() + "-" + m.isoWeeks();
		}


		var createWeeksArray = function(timestamp) {
			var arr = [];
			var limit = 52;
			var weekInMs = 86400 * 1000 * 7;

			arr.push(getWeekString(timestamp));

			while (limit > 0) {
				timestamp -= weekInMs;
				arr.push(getWeekString(timestamp));
				limit--;
			}

			return arr;
		}

		var createMonthsArray = function(timestamp) {
			var m = moment(timestamp);
			var arr = [];

			arr.push(m.year() + "-" + (m.month()+1));

			for (var i = 11; i >= 0; i--) {
				m = m.subtract(1, 'months');
				arr.push(m.year() + "-" + (m.month() + 1)); // We will use one-based month indeces
			};
			console.log("MONTH ARR");
			console.log(arr);
			return arr;
		}

		function beautifyDuration(timeInMs) {
			if (timeInMs === 0) return "---";
			var secs = Math.floor(timeInMs / 1000);
			if (secs < 60) return '1m';
			var mins = Math.floor(secs / 60);
			if (mins < 60) return mins + "m";
			var hours = Math.floor(mins / 60);
			var leftMins = mins % 60;
			if (leftMins === 0) return hours + "h 0m";
			return hours + "h " + leftMins + "m";
		}

		var beautifiedWeekString = function(weekString) {
			var parts = weekString.split('-');
			return "<strong>" + parts[1] + "</strong><span style='font-size: 11px; font-style: italic;''> (" + parts[0] + ")</span>";
		}
		// Note that weekString can also be monthString (same for weekByWeekTable)
		var buildRow = function(upperLimitInMs, weekString, weekByWeekTable, schemaItems, itemsCount) {

			var firstTd = '<td>' + beautifiedWeekString(weekString) + '</td>';
			
			if (!weekByWeekTable.hasOwnProperty(weekString)) {
				return firstTd + _.repeat('<td>---</td>', itemsCount);
			}

			//var weekUpperLimitInMs = 3600 * 1000 * 100; // 100 hours is color cap

			var row = firstTd;
			var weekObj = weekByWeekTable[weekString];
			_.forOwn(schemaItems, function(item) {
				if (weekObj.hasOwnProperty(item.id)) {
					var d = weekObj[item.id];
					var darkenAmount = Math.floor(d / upperLimitInMs * 95);
					var bg = tinycolor('#eeeeee').darken(darkenAmount);
					var textcolor = bg.isDark() ? 'fff' : '222'; 

					row += '<td style="color: #' + textcolor + '; background-color: ' + bg.toHexString() + ';">' + beautifyDuration(d) + '</td>';
				} else {
					row += '<td>---</td>';
				}
				
			});

			return row;

		}

		var buildSignalRow = function(upperLimitInCount, dateString, dateTable, signalsTable, itemsCount) {

			var firstTd = '<td>' + beautifiedWeekString(dateString) + '</td>';
			
			if (!dateTable.hasOwnProperty(dateString)) {
				return firstTd + _.repeat('<td>---</td>', itemsCount);
			}

			//var weekUpperLimitInMs = 3600 * 1000 * 100; // 100 hours is color cap

			var row = firstTd;
			var dateObj = dateTable[dateString];
			_.forOwn(signalsTable, function(item) {
				if (dateObj.hasOwnProperty(item.id)) {
					var count = dateObj[item.id];
					var darkenAmount = Math.floor(count / upperLimitInCount * 95);
					var bg = tinycolor('#eeeeee').darken(darkenAmount);
					var textcolor = bg.isDark() ? 'fff' : '222'; 

					row += '<td style="color: #' + textcolor + '; background-color: ' + bg.toHexString() + ';">' + count + '</td>';
				} else {
					row += '<td>---</td>';
				}
				
			});

			return row;

		}

		// This and buildTableBodyWeek could be collapsed into one method later
		var buildTableBodyMonth = function(monthByMonthTable, schemaItems) {

			var itemsCount = _.keys(schemaItems).length;

			var body = '';
			var upperLimitInMs = 3600 * 1000 * 400; // 400 hours is color cap for month

			var monthsArray = createMonthsArray(Date.now());
			console.error("STARTING TO BUILD TABLE FOR MONTH");
			console.log(monthsArray);
			console.log(monthByMonthTable);

			_.each(monthsArray, function(monthString) {
				body += '<tr>';
				body += buildRow(upperLimitInMs, monthString, monthByMonthTable, schemaItems, itemsCount);
				body += '</tr>';

			});
			console.error("COMPARISONG TABLE BODY (FOR MONTH)");
			console.log(body);
			return body;

			//var sortedArrayOfMonthStrings = getWeekArray(weekByWeekTable);

		}

		var buildTableBodyWeek = function(weekByWeekTable, schemaItems) {

			var itemsCount = _.keys(schemaItems).length;

			var body = '';
			var upperLimitInMs = 3600 * 1000 * 100; // 100 hours is color cap for week

			var weeksArray = createWeeksArray(Date.now());

			_.each(weeksArray, function(weekString) {
				body += '<tr>';
				body += buildRow(upperLimitInMs, weekString, weekByWeekTable, schemaItems, itemsCount);
				body += '</tr>';

			});
			console.error("COMPARISONG TABLE BODY");
			console.log(body);
			return body;

			var sortedArrayOfWeekStrings = getWeekArray(weekByWeekTable);

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
				} else if (elementType === 'showSignalsTable') {
					showSignals = true;
					activate(true);
				} else if (elementType === 'showActivityTable') {
					showSignals = false;
					activate(true);
				}
			},
			onmessage: function(name, data) {
				console.log("MSG IN COMPARISONG");
				if (name === 'routechanged') {
					var route = data.route;
					var payload = data.payload;
					if (route.split('-')[0] === 'comparisons') {
						currentPayload = payload;
						showSignals = false;
						activate();
					} else {
						deactivate();
					}
				} 
				
			}


		};

	});

}

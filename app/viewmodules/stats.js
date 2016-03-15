// Admin page module
var _ = require('lodash');
var tinycolor = require('tinycolor2');
var moment = require('moment');


var SIGNALCOLOR = '777777';

module.exports = function(Box) {

	Box.Application.addModule('stats', function(context) {
		console.log("INITING SETTINGS VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());
		// This module must do lot of work on the UI thread
		var dataNeeded = ['sortedDurations', 'schemaItems', 'schemaTree', 'dayByDayPerSchemaId', 'eventsAndSignalsList', 'signalsTable', 'dayByDayCountPerSignalId'];

		var currentPayload = null;
		var startTs= Date.now() - 4 * 86400 * 1000;
		var startTs = Date.now() - 3600 * 1000 - 2000;
		var endTs = Date.now() - 3600 * 1000;

		var INNERPADDING = 16;

		var showMode = 'all';

		var viewDataCached;

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
			console.log("Activate in stats module");
			var derivedService  = context.getService('derivedData');
			var viewDataPromise = derivedService.getDeriveds(dataNeeded);
			isHidden = false;

			// Update show mode stuff
			updateShowMode();

			viewDataPromise.then(function(viewData) {
				if (isHidden) return; // User already switched to another view	

				viewDataCached = viewData;		

				// Build stats
				//$el.empty().append(JSON.stringify(viewData.schemaTree));

				buildStatView(viewData.sortedDurations, viewData.schemaItems, viewData.schemaTree);
				buildSignalTable(viewData.signalsTable, viewData.eventsAndSignalsList, viewData.dayByDayCountPerSignalId);
				// viewData is always object with transforNames being keys and data being values
				$('#globalLoadingBanner').hide();
				//$el.empty().append("<h3>STATS: " + JSON.stringify(viewData) + "</h3>");
				//bindToView(viewData.eventList, viewData.schemaTree);
				$el.show();
			});
			

		}

		var updateShowMode = function() {
			$el.find('#showroots').removeClass('btn-warning').addClass('btn-default');
			$el.find('#showleaves').removeClass('btn-warning').addClass('btn-default');
			$el.find('#showall').removeClass('btn-warning').addClass('btn-default');

			$el.find('#show' + showMode).removeClass('btn-default').addClass('btn-warning');

		}

		var decorateSchemaTree = function(decorations, schemaTree) {

			console.log("DECS");
			console.log(decorations);

			var decorateChild = function(decorations, child) {
				var sum = 0;
				if (decorations.hasOwnProperty(child.id)) {
					sum += decorations[child.id];
					child.hisOwnTotals = decorations[child.id];
				} else {
					child.hisOwnTotals = 0;
				}
				if (child.children && child.children.length > 0) {
					child.leaf = false;
					_.each(child.children, function(subChild) {
						sum += decorateChild(decorations, subChild);
					});
				} else {
					child.leaf = true;
				}
				console.log("CHILD " + child.id + " GETS: " + sum);
				child.totalTime = sum;
				return sum;

			}

			_.each(schemaTree, function(firstLevelChild) {
				decorateChild(decorations, firstLevelChild);
			})
			// Return it for being bit more functional
			return schemaTree;


		}		
		var totalTimePerSchemaIDSinceAndBeforeTimestamp =function(sortedDurations, startTimestamp, endTimestamp) {

			// sortedDurations must be sorted DESC (= latest one is first)
			// duration object keys are {start, end, d, s}

			var o = {};

			sortedDurations = _.filter(sortedDurations, function(duration) {
				return duration.end >= startTimestamp && duration.start <= endTimestamp;
			});

			// Last and first are special causes now

			if (sortedDurations.length < 2) {
				return {};
			}

			var lastEvent   = sortedDurations.shift();
			var firstEvent  = sortedDurations.pop();


			for (var i = 0, j = sortedDurations.length; i < j; i++) {
				var duration = sortedDurations[i];

				if (!o.hasOwnProperty(duration.s)) {
					o[duration.s] = 0;
				}
				o[duration.s] += duration.d;
			};

			// First event handling
			if (!o.hasOwnProperty(firstEvent.s)) {
				o[firstEvent.s] = 0;
			}
			if (firstEvent.start > startTimestamp) {
				o[firstEvent.s] += firstEvent.d;				
			} else {
				o[firstEvent.s] += firstEvent.end - startTimestamp;					
			}

			// Last event handling
			if (!o.hasOwnProperty(lastEvent.s)) {
				o[lastEvent.s] = 0;
			}
			if (lastEvent.end < endTimestamp) {
				o[lastEvent.s] += lastEvent.d;				
			} else {
				o[lastEvent.s] += endTimestamp - lastEvent.start;					
			}


			return o;
		}

		var signalCountsSinceAndBeforeTimestamp = function(eventsAndSignalsList, start, end) {
			var o = {};
			var signalsWithin = _.filter(eventsAndSignalsList, function(eventOrSignal) {
				if (!eventOrSignal.signal) return false;
				return eventOrSignal.t >= start && eventOrSignal.t <= end;
			});

			if (signalsWithin.length < 1) {
				return {};
			}

			_.each(signalsWithin, function(signal) {
				if (!o.hasOwnProperty(signal.s)) {
					o[signal.s] = 1;
				} else {
					o[signal.s] += 1;
				}
			});
			console.log("SIGNAL COUNTS PER ID");
			console.log(JSON.stringify(o));
			return o;


		}

		var decorateSignalTable = function(signalTable, signalIDToDuration) {
			var copyTable = {};
			_.forOwn(signalTable, function(signal, id) {
				copyTable[id] = {
					name: signal.name,
					id: signal.id,
					count: signalIDToDuration[id] || 0
				}
			});

			return copyTable;
		}

		var buildSignalHTML = function(decoratedSignalTable) {
			var html = '';

			_.forOwn(decoratedSignalTable, function(signal, id) {
				html += '<tr>';
				html += '<td data-sort=' + signal.name + '><button data-type="loadIndividualSignal" data-payload="' + id + '" data-toggle="modal" data-target="#individualSignalStatsModal" class="btn" style="width: 100%; text-align: left; background-color: #' + SIGNALCOLOR + '; color: white;">' + signal.name + '</button></td>';
				html += '<td data-sort=' + signal.count + '>' + signal.count + '</td>';
				html += '</tr>';
			});

			return html;
		}

		var buildSignalTable = function(signalsTable, eventsAndSignalsList, dayByDayCountPerSignalId) {
			var d = new Date();
			var startTs;
			if (currentPayload === 'today') {
				startTs = new Date(d.getFullYear(), d.getMonth(), d.getDate());
			} else if (currentPayload === 'week') {
				// Straight from Stackoverflow
				var getMonday = function(d) {
				  d = new Date(d);
				  var day = d.getDay(),
				      diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
				  return new Date(d.setDate(diff));
				}
				d = getMonday(d);	
				startTs = new Date(d.getFullYear(), d.getMonth(), d.getDate());						
			} else if (currentPayload === 'month') {
				startTs = new Date(d.getFullYear(), d.getMonth(), 1);				
			} else if (currentPayload === 'year') {
				startTs = new Date(d.getFullYear(), 0, 1);
			}

			var endTs = Date.now() + 1000;
			var signalIDToDuration = signalCountsSinceAndBeforeTimestamp(eventsAndSignalsList, startTs, endTs);
			var decoratedSignalTable = decorateSignalTable(signalsTable, signalIDToDuration);
			console.log("DECOR SIGNAL TABLE");
			console.log(decoratedSignalTable);

			$el.find('#signals_table_body').empty().append(buildSignalHTML(decoratedSignalTable));
			$el.find("#signals_table_sortable").trigger("update"); 

		}

		var buildStatView = function(sortedDurations, schemaItems, schemaTree) {
			var d = new Date();
			if (currentPayload === 'today') {
				startTs = new Date(d.getFullYear(), d.getMonth(), d.getDate());
			} else if (currentPayload === 'week') {
				// Straight from Stackoverflow
				var getMonday = function(d) {
				  d = new Date(d);
				  var day = d.getDay(),
				      diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
				  return new Date(d.setDate(diff));
				}
				d = getMonday(d);	
				startTs = new Date(d.getFullYear(), d.getMonth(), d.getDate());						
			} else if (currentPayload === 'month') {
				startTs = new Date(d.getFullYear(), d.getMonth(), 1);				
			} else if (currentPayload === 'year') {
				startTs = new Date(d.getFullYear(), 0, 1);
			}

			endTs   = Date.now() + 1000; // add one second for little buffer


			var schemaIDToDuration = totalTimePerSchemaIDSinceAndBeforeTimestamp(sortedDurations, startTs, endTs);
			var tree = decorateSchemaTree(schemaIDToDuration, schemaTree);

			$el.find('#statstable_body').empty().append(buildHTMLFromTree(tree));
			$el.find("#activities_table_sortable").trigger("update"); 


		}
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
					if (showMode !== 'leaves' || (!branch.hasOwnProperty('children') || branch.children.length === 0)) {
						subHTML += createOneElement(branch.id, false, branch.name, branch.totalTime, branch.color, depth);
						if (!branch.leaf) {
							subHTML += createOneElement(branch.id, true, '' + branch.name + ' (omat)', branch.hisOwnTotals, branch.color, depth+1);						
						}
					}

					if (branch.hasOwnProperty('children') && showMode !== 'roots') {
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
		function createOneElement(id, onlyOwn, name, totals, color, depth) {
			var beautifiedTime = beautifyTime(totals);
			var html = "<tr>"
			var padding = depth*INNERPADDING + 16;
			color = color || '554455';
			if (color.charAt(0) === '#') {
				color = color.substr(1);
			}
			var tc = tinycolor(color);
			var textcolor = tc.isDark() ? 'fff' : '222'; 
			var ownText = onlyOwn ? 'own' : 'all';			
			html += "<td data-sort='" + name + "' style='padding-left:" + padding + "px;'><button data-type='loadIndividual' data-payload='" + id + "_" + ownText + "' data-toggle='modal' data-target='#individualStatsModal' class='btn' style='width: 100%; text-align: left; background-color: #" + color + "; color: #" + textcolor+ ";'>" + name + "</button></td>";
			html += "<td data-sort=" + totals + " data-totals=" + totals + ">" + beautifiedTime + "</td>";
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



		var bindToView = function(eventList, schemaTree) {
			//$el.empty().append(JSON.stringify(eventList));
			$body = $el.find('#statstimeline_body');
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
/*
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
*/
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

		var loadDataToIndividualStatsModal = function(schemaID, onlyOwn) {
			loadTimespanModal(schemaID, onlyOwn);
			return;
			if (currentPayload === 'today') {
				loadTodayModal(schemaID, onlyOwn);
			}
			else {
				loadTimespanModal(schemaID, onlyOwn);
			}
		}

		var loadDataToIndividualSignalStatsModal = function(signalID) {
			var dayArr = getDayArrayForGivenPayload();
			var dayArrayWithTotalCount = [];
			var data = viewDataCached.dayByDayCountPerSignalId;
			var signalItem = viewDataCached.signalsTable[signalID];
			var dayGoal = signalItem.daygoal;

			_.each(dayArr, function(dateString) {

				if (!data.hasOwnProperty(dateString) || !data[dateString].hasOwnProperty(signalID)) {
					dayArrayWithTotalCount.push({date: dateString, count: 0, goal: resolveGoal(0, dayGoal)});
					return;
				}
				var count = data[dateString][signalID];
				dayArrayWithTotalCount.push({date: dateString, count: count, goal: resolveGoal(count, dayGoal)});

			});	

			$el.find('#individual_signalstatstable_body').empty().append(buildIndividualSignalStatsHTML(dayArrayWithTotalCount));
			$el.find('#individual_signalstatstable').trigger('update');
			
			$el.find('#individual_signalstats_title').empty().append(signalItem ? signalItem.name : '---');
			$el.find('#individual_signalstats_goalstring').empty().append(getGoalStringSignal(dayGoal));

		}

		var resolveAllChildrenOfSchemaId = function(schemaID) {
			console.log("RESOLVING KIDS FOR SCHEMA ID: " + schemaID);
			var schemaItem = viewDataCached.schemaItems[schemaID];
			console.log(schemaItem);
			if (schemaItem && schemaItem.hasOwnProperty('children') && schemaItem.children.length !== 0) {
				var kids = _.map(schemaItem.children, resolveAllChildrenOfSchemaId);
				kids.push(schemaID);
				return _.flattenDeep(kids);
			}

			return [schemaID];
		}

		var getTimeBar = function(timeInMs) {
			var bar = '';
			var perc = Math.round(timeInMs / (86400 * 1000) * 100);

			console.error("TIME: " + timeInMs + ", PERC: " + perc);
			bar += '<div class="progress progress-xs">'
			bar += '<div class="progress-bar bg-color-blue" role="progressbar" style="width:' + perc + '%;"></div'
			bar += '</div'
			return bar;			
		}

		var buildIndividualSignalStatsHTML = function(dayArray) {
			var html = '';
			for (var i = 0, j = dayArray.length; i < j; i++) {
				var day = dayArray[i];
				var m = moment(day.date, 'DD-MM-YYYY');
				var weekDay = m.isoWeekday();
				var weekStart = '';
				var highlight = '';
				if (weekDay === 1) {
					var newWeek = m.isoWeek();
					weekStart = "<span style='float: right; font-size: 10px; color: #333;'>(vko " + newWeek + ")</span>"; 
					highlight = 'warning';
				}
				var goalSpan;
				if (day.goal === undefined) {
					// No goal rule defined
					goalSpan = '---';
				}
				else if (day.goal) {
					goalSpan = '<span class="txt-color-green"><i class="fa fa-check"></i></span>';
				} else {
					goalSpan = '<span class="txt-color-red"><i class="fa fa-times"></i></span>';
				}
				
				html += '<tr class="'  + highlight + '">';
				html += '<td data-sort="'+ m.format('YYYY-MM-DD') + '">' + m.format('DD.MM.YYYY (ddd)') + '' + weekStart + '</td>';
				html += '<td data-sort=' + day.count + '>' + day.count + '</td>';
				html += '<td>' + goalSpan + '</td>';
				html += '</tr>';
			};

			return html;

		}

		var buildIndividualStatsHTML = function(dayArray) {
			var html = '';
			

			for (var i = 0, j = dayArray.length; i < j; i++) {
				var day = dayArray[i];
				var m = moment(day.date, 'DD-MM-YYYY');
				var weekDay = m.isoWeekday();
				var weekStart = '';
				var highlight = '';
				if (weekDay === 1) {
					var newWeek = m.isoWeek();
					weekStart = "<span style='float: right; font-size: 10px; color: #333;'>(vko " + newWeek + ")</span>"; 
					highlight = 'warning';
				}

				var goalSpan;
				if (day.goal === undefined) {
					// No goal rule defined
					goalSpan = '---';
				}
				else if (day.goal) {
					goalSpan = '<span class="txt-color-green"><i class="fa fa-check"></i></span>';
				} else {
					goalSpan = '<span class="txt-color-red"><i class="fa fa-times"></i></span>';
				}

				
				html += '<tr class="'  + highlight + '">';
				html += '<td data-sort="'+ m.format('YYYY-MM-DD') + '">' + m.format('DD.MM.YYYY (ddd)') + '' + weekStart + '</td>';
				html += '<td data-sort=' + day.t + '>' + beautifyTime(day.t) + '</td>';
				html += '<td>' + getTimeBar(day.t) + '</td>';
				html += '<td>' + goalSpan + '</td>';
				html += '</tr>';
			};

			return html;
		}

		var resolveGoal = function(value, goalrule) {
			// goalrule example: '>3600'
			if (!goalrule || goalrule === '') return undefined; // No goal rule to apply

			var parts = goalrule.split('_');

			if (parts[0] === 'lt') {
				return value < parseInt(parts[1]);
			}
			if (parts[0] === 'le') {
				return value <= parseInt(parts[1]);
			}
			if (parts[0] === 'gt') {
				return value > parseInt(parts[1]);
			}
			if (parts[0] === 'ge') {
				return value >= parseInt(parts[1]);
			}
			if (parts[0] === 'e') {
				return value === parseInt(parts[1]);
			}
		}

		var loadTimespanModal = function(schemaID, onlyOwn) {

			console.log("LOADING TIME SPAN MODAL");
			console.log(schemaID + " | " + onlyOwn);

			console.log(viewDataCached.schemaItems);
			var schemaItem = viewDataCached.schemaItems[schemaID];
			var dayGoal = schemaItem.daygoal;
			var allIDsToBeTotaled = [];
			var kids = [schemaID];

			if (!onlyOwn) {
				kids = resolveAllChildrenOfSchemaId(schemaID);
				kids = _.flattenDeep(kids);
			} 

			console.log("KIDS ARE: " + JSON.stringify(kids));
			allIDsToBeTotaled = _.concat(allIDsToBeTotaled, kids);
			console.log("ALL IDS ARE: " + JSON.stringify(allIDsToBeTotaled));
			var dayArr = getDayArrayForGivenPayload();	

			var dayArrayWithTotalTime = [];
			var data = viewDataCached.dayByDayPerSchemaId;

			_.each(dayArr, function(dateString) {
				if (!data.hasOwnProperty(dateString)) {
					dayArrayWithTotalTime.push({date: dateString, t: 0, goal: resolveGoal(0, dayGoal)});
					return;
				}

				var sum = 0;
				var dayData = data[dateString];

				_.each(kids, function(kid) {
					if (dayData.hasOwnProperty(kid)) {
						sum += dayData[kid];
					}
				});

				dayArrayWithTotalTime.push({date: dateString, t: sum, goal: resolveGoal(sum, dayGoal)});
			});
			console.warn("DAY ARRAY WITH TOTAL TIME");
			console.log(dayArrayWithTotalTime);	

			$el.find('#individual_statstable_body').empty().append(buildIndividualStatsHTML(dayArrayWithTotalTime));
			$el.find('#individual_statstable').trigger('update');
			// Changed here by adding var in front of schemaItem
			
			var titleString = schemaItem ? schemaItem.name : '---';
			if (onlyOwn) titleString += " (vain omat)";
			var subTitleString = !onlyOwn ? "Alaryhmiin kuuluvat aktiviteetit mukana tilastossa!" : "Alaryhmiin kuuluvat aktiviteetit EIVÄT ole mukana!";

			$el.find('#individual_stats_title').empty().append(titleString);
			$el.find('#individual_stats_subtitle').empty().append(subTitleString);
			$el.find('#individual_stats_goalstring').empty().append(getGoalString(dayGoal));



		}

		var getComparisonString = function(comp) {
			if (comp === 'lt') return 'alle';
			if (comp === 'le') return 'maksimissaan';
			if (comp === 'gt') return 'enemmän kuin';
			if (comp === 'ge') return 'vähintään';
			if (comp === 'e')  return 'tasan'; 
			return '?';

		}
		var getGoalStringSignal = function(goalrule) {
			if (!goalrule || goalrule === '') return 'Päivätavoite: ---';

			var parts = goalrule.split('_');
			var compString = getComparisonString(parts[0]);

			return 'Päivätavoite: ' + compString + ' ' + parseInt(parts[1]) + ' kpl';
		}

		var getGoalString = function(goalrule) {
			if (!goalrule || goalrule === '') return 'Päivätavoite: ---';

			var parts = goalrule.split('_');
			var compString = getComparisonString(parts[0]);

			return 'Päivätavoite: ' + compString + ' ' + beautifyTime(parseInt(parts[1]));
		}


		var getMonday = function(d) {
				  d = new Date(d);
				  var day = d.getDay(),
				      diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
				  return new Date(d.setDate(diff));
		}
				
		var getDayArrayForGivenPayload = function() {

			var arr = [];
			var d = new Date();

			var limitTs = d;
			if (currentPayload === 'today') {
				limitTs = new Date(d.getFullYear(), d.getMonth(), d.getDate());
			}
			else if (currentPayload === 'week') {
				limitTs = getMonday(d);
				console.log("Week limit: " + limitTs);
			} else if (currentPayload === 'month') {
				limitTs = new Date(d.getFullYear(), d.getMonth(), 1);
			} else if (currentPayload === 'year') {
				limitTs = new Date(d.getFullYear(), 0, 1);				
			}


			while (limitTs <= d) {
				arr.push(moment(d).format('DD-MM-YYYY'));
				d -= 86400 * 1000;
			}
			console.warn("DAY ARRAY");
			console.log(JSON.stringify(arr));
			return arr;

		}
		

		// Public API
		return {
			messages: ['routechanged'],
			onclick: function(event, element, elementType) {
				event.preventDefault();
				console.error("EVENT TARGET");
				console.error(event.target);
				console.log("CLICK IN stats");

				if (elementType === 'addactivity') gatherAndAddActivity();
				else if (elementType === 'deleteactivity') {
					var timestampPlusSchemaID = $(element).data('payload');
					sendDeleteRequestForEvent(timestampPlusSchemaID);
				} else if(elementType === 'activities_showall') {
					showMode = 'all';
					INNERPADDING = 16;
					reloadTable();
				} else if (elementType === 'activities_showroots') {
					showMode = 'roots';
					INNERPADDING = 0;
					reloadTable();
				} else if (elementType === 'activities_showleaves') {
					showMode = 'leaves';
					INNERPADDING = 0;
					reloadTable();
				} else if (elementType === 'loadIndividual') {
					var payload = $(element).data('payload');
					var parts = payload.split('_');
					var schemaID = parts[0];
					var onlyOwn = parts[1] === 'own';
					loadDataToIndividualStatsModal(schemaID, onlyOwn);
				} else if (elementType === 'loadIndividualSignal') {
					var signalID = $(element).data('payload');
					loadDataToIndividualSignalStatsModal(signalID);
				}
			},
			onmessage: function(name, data) {
				console.log("ON MESSAGE IN stats");
				if (name === 'routechanged') {
					var route = data.route;
					if (route.split('-')[0] === 'stats') {
						console.log("CAUGHT IN stats");

						if (data.payload) {
							currentPayload = data.payload;
						}
						activate();
					} else {
						deactivate();
					}
				} 
				
			}


		};

	});

}

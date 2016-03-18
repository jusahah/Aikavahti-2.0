// Main front page module
var tinycolor = require('tinycolor2');
var moment = require('moment');

var SIGNALCOLOR = '777777';

module.exports = function(Box) {
	Box.Application.addModule('front', function(context) {

		console.log("INITING FRONT VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = ['frontViewData', 'dayByDayPerSchemaId']; // empty means that this view can always render instantly (no need to wait on data)
		// Private stuff

		var currentNow = null;
		var loopTimerHandle = null;

		var oldTimeString;

		var currentDayTotalWithoutOngoing;
		var currentDayGoal;
		var dayGoalDisabled;

		var lastFlush = Date.now();

		var $currentPanelWrapper;

		var resolveBarWidth = function(newDuration, oldDuration, dayGoal) {
			if (!dayGoal) return 0;
			console.log(newDuration + ", " + oldDuration + ", " + dayGoal);
			var fullDuration = newDuration + oldDuration;

			var parts = dayGoal.split('_');
			if (parts.length !== 2) return 0;
			var limit = parts[1];

			var perc = Math.round(100 * fullDuration / limit);

			return perc;

		}

		var loopFun = function() {
				if (!currentNow) {
					$currentPanelWrapper.find('#currentevent_duration').empty().append('---');
					$currentPanelWrapper.find('#daygoalfront').empty().append('Päivätavoite: ---');
					$currentPanelWrapper.find('#daygoalbar').css('width', '0%');
					return;
				}
				// We need two calculations: one for duration clock and one for goal percentage update
				var newDuration = Date.now() - lastFlush;
				var newDurationKesto = Date.now() - currentNow.start;
				console.log("NEW duration in front loopFun: " + newDurationKesto);
				var timeString = beautifyDuration(newDuration);
				var timeStringKesto = beautifyDuration(newDurationKesto);
				console.log(timeStringKesto + " vs. " + oldTimeString);
				if (timeStringKesto !== oldTimeString) {
					// Avoid DOM hit when no needed
					console.log("Changing duration in front");
					$currentPanelWrapper.find('#currentevent_duration').empty().append("Kesto: <strong>" + timeStringKesto + "</strong>");
				}
				oldTimeString = timeStringKesto;

				// Day goal updating
				if (!dayGoalDisabled) {
					var daygoalText = $currentPanelWrapper.find('#daygoalfront');
					var daygoalBar  = $currentPanelWrapper.find('#daygoalbar');

					var barPercWidth = resolveBarWidth(newDuration, currentDayTotalWithoutOngoing, currentDayGoal);
					console.log("BAR WIDTH IN PERC: " + barPercWidth);
					$currentPanelWrapper.find('#daygoalperc').empty().append(' | Kulunut: ' + barPercWidth + '%');
					daygoalBar.css('width', barPercWidth + '%');
				}

				Box.Application.broadcast('currenteventupdate', {
					color: currentNow.color,
					name: currentNow.name,
					timeString: timeString
				});
		}

		var loopTimer = function() {
			if (loopTimerHandle) {
				return;
			}

			loopTimerHandle = setInterval(loopFun, 1010);
			loopFun();
		} 

		var stopLoopTimer = function() {
			if (loopTimerHandle) {
				clearInterval(loopTimerHandle);
				loopTimerHandle = null;
			}
		}

		var deactivate = function() {
			stopLoopTimer();
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

				console.log(viewData.frontViewData.currentPlusKids);

				if (isHidden) return; // User already switched to another view			

				// viewData is always object with transforNames being keys and data being values
				$('#globalLoadingBanner').hide();
				//$el.empty().append("<h3>" + JSON.stringify(viewData) + "</h3>");
				bindToView(viewData.frontViewData, viewData.dayByDayPerSchemaId);
				$el.show();
				loopTimer();
			});
			

		}

		var resolveCurrentDayTotal = function(schemaIDs, dayByDayPerSchemaId) {
			console.log("Resolve old duration for: " + JSON.stringify(schemaIDs));
			console.log(dayByDayPerSchemaId);

			var sum = 0;

			_.each(schemaIDs, function(schemaID) {
				schemaID = parseInt(schemaID);
				var todayString = moment().format('DD-MM-YYYY');

				if (dayByDayPerSchemaId.hasOwnProperty(todayString)) {
					var dayObj = dayByDayPerSchemaId[todayString];
					if (dayObj.hasOwnProperty(schemaID)) {
						sum += dayObj[schemaID];
					}
				}

				sum += 0;
			});

			return sum;

		}



		var bindToView = function(data, dayByDayPerSchemaId) {
			if (!data) return;

			var current = data.current;
			var currentPlusKids = data.currentPlusKids;
			currentNow = current;
			var lastTen = data.lastTen;
			console.warn(current);
			currentDayTotalWithoutOngoing = resolveCurrentDayTotal(currentPlusKids, dayByDayPerSchemaId);
			console.log("Old duration is: " + currentDayTotalWithoutOngoing);
			// Current stuff
			$currentPanelWrapper = $el.find('#currentevent_wrapper');
			$currentPanel = $currentPanelWrapper.find('#currentevent_panel');

			
			var currName = $currentPanel.find('#currentevent_name');
			var color = parseInt(current.s) === 0 ? '554455' : current.color;
			var name  = parseInt(current.s) === 0 ? '(poissa)' : current.name;
			currentDayGoal = current.daygoal;
			console.log("Day goal: " + current.daygoal);
			if (color.charAt(0) === '#') {
				color = color.substr(1);
			}
			var tc = tinycolor(color);
			var textcolor = tc.isDark() ? 'fff' : '222'; 
			$currentPanel.css('background-color', '#' + color);
			$currentPanel.css('color', '#' + textcolor);			
			currName.empty().append(current.name);

			$currentPanelWrapper.find('#currentevent_started').empty().append("Aloitettu: <strong>" + beautifyTimestamp(current.start) + "</strong>");
			$currentPanelWrapper.find('#currentevent_duration').empty().append("Kesto: <strong>" + beautifyDuration(Date.now() - current.start) + "</strong>");

			// Build daygoal bar

			var daygoalBar = $el.find('#daygoalbar');
			daygoalBar.css('background-color', '#' + color);
			daygoalBar.css('width', '0%');
			console.warn(currentDayGoal);
			var goalString = getGoalString(currentDayGoal);

			// whether to enable/disable day goal tracking on front
			if (hasGoal(currentDayGoal)) {	
				dayGoalDisabled = false;
				$el.find('#daygoalfrontholder').show();				
			}
			else {
				dayGoalDisabled = true;
				$el.find('#daygoalfrontholder').hide();
			}
			$el.find('#daygoalfront').empty().append(goalString);
			$el.find('#daygoalperc').empty().append(' | Kulunut: ---');
			// Last ten stuff
			$lastTenWrapper = $el.find('#lastten_wrapper');
			$lastTenUL = $lastTenWrapper.find('ul');
			$lastTenUL.empty();

			var todayStartTimestamp = getTodayStartTimestamp();
			var first = true;
			_.each(lastTen, function(oneLast) {
				if (oneLast.start >= todayStartTimestamp) {
					$lastTenUL.append(getLastTenLI(oneLast, first));
				}
				first = false;
				
			});


			// Change activity buttons
			var ss = context.getService('settingsService');
			ss.getSettings().then(function(settings) {

				if (settings.view.userSelectedEventsShow) {
					var filteredWithUserSelections = filterUserSelectedButtons(data.schemaItems, settings.view.userSelectedEvents);
					buildActivityButtons(filteredWithUserSelections);

				} else {
					if (settings.view.eventsOnlyToLeaves) {
						$el.find('#showleaves_b').removeClass('btn-default').addClass('btn-success');
						$el.find('#showall_b').removeClass('btn-success').addClass('btn-default');
						buildActivityButtons(data.schemaLeaves);
					} else {
						$el.find('#showleaves_b').removeClass('btn-success').addClass('btn-default');
						$el.find('#showall_b').removeClass('btn-default').addClass('btn-success');

						buildActivityButtons(data.schemaItems)
					}					
				}	

			});

			// Change signal buttons
			buildSignalButtons(data.signalsArray);


			
		}
		// To be moved to utility module
		var getComparisonString = function(comp) {
			if (comp === 'lt') return 'alle';
			if (comp === 'le') return 'maksimissaan';
			if (comp === 'gt') return 'enemmän kuin';
			if (comp === 'ge') return 'vähintään';
			if (comp === 'e')  return 'tasan'; 
			return '?';

		}	

		var hasGoal = function(goalrule) {
			if (!goalrule) return false;
			return goalrule.split('_').length === 2;
		}

		var getGoalString = function(goalrule) {
			if (!goalrule || goalrule === '' || goalrule == '0') return 'Päivätavoite: ---';

			var parts = goalrule.split('_');
			var compString = getComparisonString(parts[0]);

			return 'Päivätavoite: ' + compString + ' ' + beautifyTime(parseInt(parts[1]));
		}

		var beautifyTime = function(timeInMs) {
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

		var buildSignalButtons = function(signals) {
			var tc = tinycolor(SIGNALCOLOR);
			var textcolor = tc.isDark() ? 'fff' : '222'; 
			var html = '';

			_.each(signals, function(signal) {
				html += '<button style="margin: 4px; font-size: 16px; color: #' + textcolor + '; background-color: #' + SIGNALCOLOR + ';" data-type="triggersignal" data-payload="' + signal.id + '" class="btn">' + signal.name + '</button>';
			});

			$el.find('#newsignal_buttons').empty().append(html);
		}

		var getTodayStartTimestamp = function() {

			var now = new Date();
			return new Date(now.getFullYear(), now.getMonth(), now.getDate());


		}

		var filterUserSelectedButtons = function(schemaItems, userSelecteds) {
			var userSelectedItems = _.filter(schemaItems, function(item) {
				return userSelecteds.indexOf(parseInt(item.id)) !== -1;
			});
			return userSelectedItems;
		}

		var buildActivityButtons = function(schemaItems) {
			$buttonsArea = $el.find('#newactivity_buttons');

			var html = '';

			schemaItems.unshift({name: '(poissa)', id: 0, color: '554455'});

			_.each(schemaItems, function(item) {
				var color = item.color || '554455';
				if (color.charAt(0) === '#') {
					color = color.substr(1);
				}				
				var tc = tinycolor(color);
				var textcolor = tc.isDark() ? 'fff' : '222'; 
				html += '<button style="margin: 4px; font-size: 16px; color: #' + textcolor + '; background-color: #' + color + ';" data-type="changeactivity" data-payload="' + item.id + '" class="btn btn-large">' + item.name + '</button>'
			});

			$buttonsArea.empty().append(html);
			return html;
		}

		var getLastTenLI = function(schemaItem, isFirst) {

			var started = beautifyTimestamp(schemaItem.start);
			var ended   = beautifyTimestamp(schemaItem.end);
			var name = schemaItem.id ? schemaItem.name : '(poissa)'; 

			var li = '<li>';
			var color = schemaItem.color || '554455';
			if (color.charAt(0) === '#') {
				color = color.substr(1);
			}				
			var tc = tinycolor(color);

			var notes = '';
			var toggleText = '';
			var icon = '';
			if (schemaItem.notes && schemaItem.notes !== '') {
				notes = schemaItem.notes;
				toggleText = 'data-toggle="modal" data-target="#quickNoteModal"  data-type="openEventInfo" data-payload="' + notes + '"'; 
				icon = '<i class="fa fa-warning" style="position: absolute; font-size: 8px; bottom: 2px; right: 2px;"></i>';	
			}
			
			var textcolor = tc.isDark() ? 'txt-color-white' : 'txt-color-black'; 	
			var timecolor = tc.isDark() ? 'fff' : '222';		
			li += '<span ' + toggleText + ' style="text-align: center; min-width: 88px; position: relative; background-color:#' + color + ';" class="' + textcolor + '" data-icon="fa-time"><span style="color: #' + timecolor + '; position: absolute; bottom: 6px; left: 12px; font-size: 10px;">' + (isFirst ? '??.??' : ended) + '-' + started + '</span>' + name + icon + '</span>';
			li += '</li>';


			return li;
		}

		var beautifyTimestamp = function(timestamp) {
			var d = new Date(timestamp);
			var tunnit = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
			var mins   = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
			return tunnit + "." + mins;
		}

		function beautifyDuration(timeInMs) {
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

		function changeShowActivity(newVal) {
			var settingsUpdatedPromise = context.getService('settingsService').changeShowLeavesSettings(newVal);
			settingsUpdatedPromise.then(function() {
				activate();
			}).catch(function() {
				console.error("FRONT VIEW: Change show activity setting failed");
			})
		}

		function newActivityClicked(schemaID) {
			var es = context.getService('eventService');
			es.newEvent(schemaID);
		}
		
		function populateAddNotesModal() {

			var name = currentNow.name;
			var startString = beautifyTimestamp(currentNow.start);
			var area = $el.find('#notearea');
			area.val('');
			area.data('eventtimestamp', currentNow.start);

			$el.find('#notes_modal_title').empty().append(name + " (" + startString + " --> )");
			if (currentNow.hasOwnProperty('notes')) {
				area.val(currentNow.notes);
				
			}
		}

		function saveNotes() {
			var area = $el.find('#notearea');
			var eventtimestamp = area.data('eventtimestamp');

			if (!eventtimestamp || eventtimestamp === '') {
				console.error('Event timestamp missing for some reason - can not save notes!');
				return;
			}

			var notes = area.val();

			var es  = context.getService('eventService');
			var prom = es.saveNotes(eventtimestamp, notes);




		}

		function populateQuickNoteModal(notes) {
			$el.find('#quickNoteModal_text').empty().append(notes);

		}

		function triggerSignal(signalID) {
			var es  = context.getService('eventService');
			var prom = es.newSignal(signalID);			
		}

		// Public API
		return {
			messages: ['cachewasflushed', 'routechanged'],
			onclick: function(event, element, elementType) {
				console.log("CLICK IN FRONT");
				if (elementType === 'newactivity_showleaves') {
					changeShowActivity(true);
				} else if (elementType === 'newactivity_showall') {
					changeShowActivity(false);
				} else if (elementType === 'changeactivity') {
					var schemaID = $(element).data('payload');
					newActivityClicked(schemaID);
				} else if (elementType === 'addnotes') {
					populateAddNotesModal();
				} else if (elementType === 'savenotes') {
					saveNotes();
				} else if (elementType === 'openEventInfo') {
					var notes = $(element).data('payload');
					if (notes && notes !== '') {
						populateQuickNoteModal(notes);
					}
				} else if (elementType === 'triggersignal') {
					var id = $(element).data('payload');
					triggerSignal(id);
				} 
			},
			onmessage: function(name, data) {
				if (name === 'routechanged') {
					var route = data.route;
					if (route.split('-')[0] === 'front') {
						activate();
					} else {
						deactivate();
					}
				} else if(name === 'cachewasflushed') {
					// We need to update lastFlush so that goal percentage can calculate correct
					lastFlush =  Date.now();
				}
			}


		};

	});		
}

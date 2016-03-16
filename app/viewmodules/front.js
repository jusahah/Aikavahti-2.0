// Main front page module
var tinycolor = require('tinycolor2');
var moment = require('moment');

var SIGNALCOLOR = '777777';

module.exports = function(Box) {
	Box.Application.addModule('front', function(context) {

		console.log("INITING FRONT VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = ['frontViewData']; // empty means that this view can always render instantly (no need to wait on data)
		// Private stuff

		var currentNow = null;
		var loopTimerHandle = null;

		var $currentPanelWrapper;

		var loopFun = function() {
				console.warn("LOOPING !");
				if (!currentNow) {
					$currentPanelWrapper.find('#currentevent_duration').empty().append('---');
					return;
				}
				var timeString = beautifyDuration(Date.now() - currentNow.start);
				$currentPanelWrapper.find('#currentevent_duration').empty().append(timeString);
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
			console.log("Activate fron");
			var derivedService  = context.getService('derivedData');
			var viewDataPromise = derivedService.getDeriveds(dataNeeded);
			isHidden = false;

			viewDataPromise.then(function(viewData) {
				console.log("VIEW DATA RECEIVED IN FRONT: ");
				console.log(viewData);
				console.log("Is Hidden?" + isHidden);
				if (isHidden) return; // User already switched to another view			

				// viewData is always object with transforNames being keys and data being values
				$('#globalLoadingBanner').hide();
				//$el.empty().append("<h3>" + JSON.stringify(viewData) + "</h3>");
				bindToView(viewData.frontViewData);
				$el.show();
				loopTimer();
			});
			

		}



		var bindToView = function(data) {
			console.error(d3); // We have link to it
			if (!data) return;
			console.log("----FRONT VIEW DATA------ building HTML");
			console.log(data);

			var current = data.current;
			currentNow = current;
			var lastTen = data.lastTen;

			// Current stuff
			$currentPanelWrapper = $el.find('#currentevent_wrapper');
			$currentPanel = $currentPanelWrapper.find('#currentevent_panel');

			
			var currName = $currentPanel.find('#currentevent_name');
			var color = parseInt(current.s) === 0 ? '554455' : current.color;
			var name  = parseInt(current.s) === 0 ? '(poissa)' : current.name;
			if (color.charAt(0) === '#') {
				color = color.substr(1);
			}
			console.warn("COLOR IN FRONT: " + color);
			var tc = tinycolor(color);
			var textcolor = tc.isDark() ? 'fff' : '222'; 
			$currentPanel.css('background-color', '#' + color);
			$currentPanel.css('color', '#' + textcolor);			
			currName.empty().append(current.name);

			$currentPanelWrapper.find('#currentevent_started').empty().append(beautifyTimestamp(current.start));
			$currentPanelWrapper.find('#currentevent_duration').empty().append(beautifyDuration(Date.now() - current.start));

			// Last ten stuff
			$lastTenWrapper = $el.find('#lastten_wrapper');
			$lastTenUL = $lastTenWrapper.find('ul');
			$lastTenUL.empty();

			var todayStartTimestamp = getTodayStartTimestamp();
			var first = true;
			_.each(lastTen, function(oneLast) {
				console.log("APPENDING ONE");
				if (oneLast.start >= todayStartTimestamp) {
					$lastTenUL.append(getLastTenLI(oneLast, first));
				}
				first = false;
				
			});


			// Change activity buttons
			var ss = context.getService('settingsService');
			ss.getSettings().then(function(settings) {
				console.log("-------SEttings in front.js----");
				console.log(settings);

				if (settings.view.userSelectedEventsShow) {
					var filteredWithUserSelections = filterUserSelectedButtons(data.schemaItems, settings.view.userSelectedEvents);
					console.error("----FILTERED ONES");
					console.log(filteredWithUserSelections);
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
			console.log("USER SEL");
			console.log(JSON.stringify(userSelecteds));
			console.log(JSON.stringify(schemaItems));
			var userSelectedItems = _.filter(schemaItems, function(item) {
				return userSelecteds.indexOf(parseInt(item.id)) !== -1;
			});
			return userSelectedItems;
		}

		var buildActivityButtons = function(schemaItems) {
			console.error("ACTIVITY BUTTONS");
			console.log(JSON.stringify(schemaItems));
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
			console.log("BUILDING LI FOR last 10");
			console.log(schemaItem);
			var started = beautifyTimestamp(schemaItem.start);
			var ended   = beautifyTimestamp(schemaItem.end);
			console.error("SCHEMA ITEM");
			console.log(JSON.stringify(schemaItem));
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
			console.error("CHANGE SHOW ACTIVITY: " + newVal);
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
			console.log("EDITING TEXT AREA: " + currentNow.start);
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

			if (notes.length > 1024) {
				console.error('Too long string in notes area');
				return;
			}


			var es  = context.getService('eventService');
			var prom = es.saveNotes(eventtimestamp, notes);




		}

		function populateQuickNoteModal(notes) {
			console.log("POPULATING NOTE MODAL: " + notes);
			$el.find('#quickNoteModal_text').empty().append(notes);

		}

		function triggerSignal(signalID) {
			var es  = context.getService('eventService');
			var prom = es.newSignal(signalID);			
		}

		// Public API
		return {
			messages: ['routechanged'],
			onclick: function(event, element, elementType) {
				console.log("CLICK IN VALIKKO");
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
				}
			}


		};

	});		
}

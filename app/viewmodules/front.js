// Main front page module
var tinycolor = require('tinycolor2');

module.exports = function(Box) {
	Box.Application.addModule('front', function(context) {

		console.log("INITING FRONT VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = ['frontViewData']; // empty means that this view can always render instantly (no need to wait on data)
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
			console.log("Activate fron");
			var derivedService  = context.getService('derivedData');
			var viewDataPromise = derivedService.getDeriveds(dataNeeded);
			isHidden = false;

			viewDataPromise.then(function(viewData) {
				if (isHidden) return; // User already switched to another view			

				// viewData is always object with transforNames being keys and data being values
				$('#globalLoadingBanner').hide();
				//$el.empty().append("<h3>" + JSON.stringify(viewData) + "</h3>");
				bindToView(viewData.frontViewData);
				$el.show();
			});
			

		}

		var bindToView = function(data) {
			if (!data) return;
			console.log("----FRONT VIEW DATA------ building HTML");
			console.log(data);

			var current = data.current;
			var lastTen = data.lastTen;

			// Current stuff
			$currentPanelWrapper = $el.find('#currentevent_wrapper');
			$currentPanel = $currentPanelWrapper.find('#currentevent_panel');

			$currentPanel.css('background-color', current.color);
			$currentPanel.find('#currentevent_name').empty().append(current.name);

			$currentPanelWrapper.find('#currentevent_started').empty().append(beautifyTimestamp(current.start));
			$currentPanelWrapper.find('#currentevent_duration').empty().append(beautifyDuration(Date.now() - current.start));

			// Last ten stuff
			$lastTenWrapper = $el.find('#lastten_wrapper');
			$lastTenUL = $lastTenWrapper.find('ul');
			$lastTenUL.empty();

			_.each(lastTen, function(oneLast) {
				console.log("APPENDING ONE");
				$lastTenUL.append(getLastTenLI(oneLast));
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
						buildActivityButtons(data.schemaLeaves);
					} else {
						buildActivityButtons(data.schemaItems)
					}					
				}	

			});


			
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
			$buttonsArea = $el.find('#newactivity_buttons');

			var html = '';

			_.each(schemaItems, function(item) {
				var color = item.color || '554455';
				var tc = tinycolor(color);
				var textcolor = tc.isDark() ? 'fff' : '222'; 
				html += '<button style="margin: 4px; font-size: 16px; color: #' + textcolor + '; background-color: #' + color + ';" data-type="changeactivity" data-payload="' + item.id + '" class="btn btn-large">' + item.name + '</button>'
			});

			$buttonsArea.empty().append(html);
			return html;
		}

		var getLastTenLI = function(schemaItem) {
			console.log("BUILDING LI FOR last 10");
			console.log(schemaItem);
			var started = beautifyTimestamp(schemaItem.start);
			var ended   = beautifyTimestamp(schemaItem.end);

			var li = '<li>';
			var color = schemaItem.color || '554455';
			li += '<span style="position: relative; background-color:#' + color + ';" class="txt-color-white" data-description="' + ended + '-' + started + '" data-icon="fa-time">' + schemaItem.name + '<i class="fa fa-warning" style="position: absolute; font-size: 8px; bottom: 2px; right: 2px;"></i></span>';
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

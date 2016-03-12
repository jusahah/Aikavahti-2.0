// Admin page module
var _ = require('lodash');

module.exports = function(Box) {

	Box.Application.addModule('timeline', function(context) {
		console.log("INITING TIMELINE VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = ['last30DaysTimelines'];

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
				console.error("TIMELINE VIEW RECEIVED SETTINGS");
				if (isHidden) return; // User already switched to another view			
				console.log("View data");
				console.log(viewData);

				context.getService('eventService').getCurrent().then(function(currentEvent){
					//var dataObj = context.getService('derivedData').easify(viewData);			
					// viewData is always object with transforNames being keys and data being values
					$('#globalLoadingBanner').hide();
					//$el.empty().append("<h3>" + JSON.stringify(viewData) + "</h3>");
					setTimelineData(viewData.last30DaysTimelines, currentEvent);
					$el.show();					
				});


			});
			
		}


		var setTimelineData = function(last30DaysTimelines, currentEvent) {
			console.log("CURRENT EVENT IN TIMELINE");
			console.log(currentEvent);

			var arr = [];
			var last30Days = createLast30(Date.now());
			/*
			_.forOwn(last30DaysTimelines, function(durationsArr, dateString) {
				arr.push({date: dateString, slug: slugify(dateString), arr: durationsArr});
			});

			arr = arr.sort(function(a, b) {
				return a.date < b.date ? 1 : -1;
			});
			console.log("Timeline data sorted in view");
			console.log(JSON.stringify(arr));
			*/
			var timelineEl = $el.find('#timelinearea');
			timelineEl.empty();

			_.each(last30Days, function(day) {
				var times = last30DaysTimelines[day.name] || [];
				var slug = slugify(day.name);
				var html = '<div id="timeline_' + slug + '" style="width: 100%; height: 68px; margin-left: 20px;"></div>';
				timelineEl.append(html);
				initTimeline(slug, day.name, times, currentEvent);
				currentEvent = null; // No more in future rounds
			});
			/*
			_.each(arr, function(dayObj) {
				var html = '<div id="timeline_' + dayObj.slug + '" style="width: 100%; height: 200px; margin-left: 20px;"></div>';
				timelineEl.append(html);
				initTimeline(dayObj);
			});
			*/
		}

		var clampStartOfTheDay = function(dateString, timestamp) {
			var start = moment(dateString, 'DD.MM.YY').valueOf();
			return timestamp <  start ? start : timestamp;
		}

		var initTimeline = function(slug, name, times, currentEvent) {
			if (currentEvent) {
				times.push({
					starting_time: clampStartOfTheDay(name, currentEvent.t),
					ending_time: Date.now(),
					id: currentEvent.s,
					color: currentEvent.color,
					name: currentEvent.name
				});
			}
			var m = moment(name, 'DD.MM.YY');
			var showName = m.format('dd DD.MM');			
			var testData = [
			  {label: showName, times: times}
			];

			var startOfDay = m.valueOf();
			var endOfDay   = startOfDay + 86400 * 1000;
			var chart = d3.timeline().margin({left: 80, right: 20, top: 22, bottom: 4}).beginning(startOfDay).ending(endOfDay).tickFormat({
				  format: d3.time.format("%H:%M"),
				  tickTime: d3.time.hours,
				  tickInterval: 2,
				  tickSize: 4
				})
				.itemHeight(14)
				.hover(function(d, i, datum) {
					console.log(d);
					console.log(i);
				});

			var svg = d3.select("#timeline_" + slug).append("svg").attr("width", 800).attr("height", 68)
			  .datum(testData).call(chart);  			
		}

		var slugify = function(dateString) {
			return dateString.split('.').join('_');
		}

		var createLast30 = function(nowTs) {
			var days = [];
			var today = new Date(nowTs);

			var startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
			var endOfDay   = new Date(startOfDay + 86400 * 1000).getTime();

			days.push({
				start: startOfDay,
				end: endOfDay,
				name: moment(startOfDay+1000).format('DD.MM.YY') // Add one thousand so... i dont know... little buffer... oh god thats just stupid tho
			});

			for (var i = 29; i >= 0; i--) {
				startOfDay -= 86400 * 1000;
				endOfDay   -= 86400 * 1000;
				days.push({
					start: startOfDay,
					end: endOfDay,
					name: moment(startOfDay+1000).format('DD.MM.YY')
				});
			};

			return days;
		}



		

		// Public API
		return {
			messages: ['routechanged'],
			onclick: function(event, element, elementType) {
				event.preventDefault();
				console.error("EVENT TARGET");
				console.error(event.target);
				console.log("CLICK IN SETTINGS");
			},
			onmessage: function(name, data) {
				console.log("ON MESSAGE IN SETTINGS");
				if (name === 'routechanged') {
					var route = data.route;
					if (route.split('-')[0] === 'timeline') {
						console.log("CAUGHT IN SETTINGS");

						activate();
					} else {
						deactivate();
					}
				} 
				
			}


		};

	});

}

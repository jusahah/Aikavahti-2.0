// Admin page module
var _ = require('lodash');
var moment = require('moment');

module.exports = function(Box) {

	Box.Application.addModule('timeline', function(context) {
		console.log("INITING TIMELINE VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = ['last30DaysTimelines'];

		var numShown = 7;

		var div = d3.select("body").append("div")   
	    .attr("class", "timelinetooltip")               
	    .style("opacity", 0);

		// Private stuff

		var deactivate = function() {
			if (!isHidden) {
				isHidden = true;
				$el.hide();
			}
		}

		var activate = function(noHide) {
			// hide right away in case we are reactivating view that is currently visible
			if (!noHide) $el.hide();
			var derivedService  = context.getService('derivedData');
			var viewDataPromise = derivedService.getDeriveds(dataNeeded);
			isHidden = false;

			// Set 7 and 30 button classes
			if (numShown === 30) {
				$el.find('#show7days').removeClass('btn-success').addClass('btn-default');
				$el.find('#show30days').removeClass('btn-default').addClass('btn-success');
			} else {
				$el.find('#show30days').removeClass('btn-success').addClass('btn-default');
				$el.find('#show7days').removeClass('btn-default').addClass('btn-success');
			}

			viewDataPromise.then(function(viewData) {
				if (isHidden) return; // User already switched to another view			

				context.getService('eventService').getCurrent().then(function(currentEvent){
					//var dataObj = context.getService('derivedData').easify(viewData);			
					// viewData is always object with transforNames being keys and data being values
					$('#globalLoadingBanner').hide();
					//$el.empty().append("<h3>" + JSON.stringify(viewData) + "</h3>");
					$el.show();
					setTimelineData(viewData.last30DaysTimelines, currentEvent);
										
				}).catch(function(err) {

					$('#globalLoadingBanner').hide();
					var globalError = $('#globalErrorBanner');
					globalError.find('h1').empty().append(err);
					globalError.show();
				});


			});
			
		}


		var setTimelineData = function(last30DaysTimelines, currentEvent) {

			var arr = [];
			var lastXDays = createLastX(Date.now(), numShown);
			//var last7Days  = createLastX(Date.now(), 7);
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

			// Import that elemet is "display: block" BEFORE width is taken here!
			var containerWidth = $el.width();
			var timelineEl = $el.find('#timelinearea');
			timelineEl.empty();

			_.each(lastXDays, function(day) {
				var times = last30DaysTimelines[day.name] || [];
				var slug = slugify(day.name);
				var html = '<div id="timeline_' + slug + '" style="width: 100%; height: 68px; margin-left: 20px;"></div>';
				timelineEl.append(html);
				initTimeline(slug, day.name, times, currentEvent, containerWidth);
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

		var getTooltipText = function(d) {
			var name = d.name || '(poissa)';

			var startString = moment(d.starting_time).format('DD.MM HH:mm');
			var endString   = moment(d.ending_time).format('DD.MM HH:mm');

			return name + " <br>(" + startString + " - " + endString + ")";  
		}

		var redrawTimelinesAfterResize = function() {
			var containerWidth = $el.width();

		}

		var initTimeline = function(slug, name, times, currentEvent, containerWidth) {

			var tickInterval = 1;

			if (containerWidth < 1300) {
				tickInterval = 2;
				if (containerWidth < 600) tickInterval = 6;
				else if (containerWidth < 1000) tickInterval = 4;
			}

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
				  tickInterval: tickInterval,
				  tickSize: 4
				})
				.itemHeight(14)
				.mouseover(function(d, i, datum) {

					
					div.transition()        
					                .duration(100)      
					                .style("opacity", .9);      
					            div.html(getTooltipText(d))  
					                .style("left", (d3.event.pageX - 90) + "px")     
					                .style("top", (d3.event.pageY - 28) + "px");    
					           
				})
				.mouseout(function(d) {
					
					div.transition().duration(200).style("opacity", 0);   
				})
				.click(function(d, i, datum) {

					div.transition()        
					                .duration(200)      
					                .style("opacity", 1);      
					            div.html(getTooltipText(d))  
					                .style("left", (d3.event.pageX - 90) + "px")     
					                .style("top", (d3.event.pageY - 28) + "px");    					
				});

			var svg = d3.select("#timeline_" + slug).append("svg").attr("width", containerWidth-80).attr("height", 68)
			  .datum(testData).call(chart);  			
		}

		var slugify = function(dateString) {
			return dateString.split('.').join('_');
		}

		var createLastX = function(nowTs, howMany) {
			var days = [];
			var today = new Date(nowTs);

			var startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
			var endOfDay   = new Date(startOfDay + 86400 * 1000).getTime();

			days.push({
				start: startOfDay,
				end: endOfDay,
				name: moment(startOfDay+1000).format('DD.MM.YY') // Add one thousand so... i dont know... little buffer... oh god thats just stupid tho
			});

			for (var i = howMany-2; i >= 0; i--) {
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
			messages: ['routechanged', 'globalresize'],
			onclick: function(event, element, elementType) {
				event.preventDefault();

				if (elementType === 'show7') {
					numShown = 7;
					activate(true);
				} else if (elementType === 'show30') {
					numShown = 30;
					activate(true);
				}
			},
			onmessage: function(name, data) {

				if (name === 'routechanged') {
					var route = data.route;
					if (route.split('-')[0] === 'timeline') {


						activate();
					} else {
						deactivate();
					}
				} else if (name === 'globalresize') {
					redrawTimelinesAfterResize();
				}
				
			}


		};

	});

}

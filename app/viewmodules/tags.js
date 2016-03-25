// Admin page module
var _ = require('lodash');
var moment = require('moment');
var tinycolor = require('tinycolor2');
var hljs = require('highlight.js');

module.exports = function(Box) {

	Box.Application.addModule('tags', function(context) {
		console.log("INITING TAGS VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = ['tagsToEvents'];

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
				$el.find('#tagstable_body').empty().append(buildHTML(viewData.tagsToEvents));
				$el.find('#tags_table').trigger('update');
				//var h = hljs.highlightAuto(JSON.stringify(viewData, null, 4));
				//$el.empty().append('<pre><code>' + h.value + '</code></pre>');				
				//$el.empty().append(JSON.stringify(viewData));
				$el.show();
			});
			
		}

		var buildHTML = function(tagsToEvents) {

			var html = '';

			_.forOwn(tagsToEvents, function(eventIDs, tagName) {
				 
				html += '<tr>';
				html += '<td data-sort="' + tagName + '">' + tagName + '</td>';
				html += '<td data-sort="' + eventIDs.length + '">' + eventIDs.length + '</td>';
				html += '<td><a data-toggle="modal" data-target="#showEventsWithTagModal" data-type="showeventswithtag" data-payload="' + tagName + '" class="btn btn-primary">Selaa</a></td>';
				html += '</tr>';
			});

			return html;
		}

		function timeStringToNote(timestamp) {
			return moment(timestamp).format('dd DD.MM.YY HH:mm');
		}

		function populateEventHistory(tagName) {
			if (!viewDataCached) return;


			var eventsArr = viewDataCached.tagsToEvents[tagName];

			eventsArr = eventsArr.sort(function(a, b) {
				return b.t - a.t;
			});

			var html = '';
			console.warn("Noted events");
			_.each(eventsArr, function(notedEvent) {
				console.log(notedEvent);
				var color = parseInt(notedEvent.s) === 0 ? '554455' : notedEvent.color;
				var name  = parseInt(notedEvent.s) === 0 ? '(poissa)' : notedEvent.name;
				var tc = tinycolor(color);
				var textcolor = tc.isDark() ? 'fff' : '222'; 

				html += '<li style="min-height: 80px;">';
				html += '<div class="smart-timeline-time">';
				html += '<small>' + timeStringToNote(notedEvent.t) + '</small>';
				html += '</div>'
				html += '<div class="smart-timeline-content">';
				html += '<span class="label" style="color: #' + textcolor + '; position: absolute; top: 0px; right: 2px; font-size: 10px; background-color: #' + color + ';">' + name + '</span>';
				html += '<p>' + notedEvent.notes + '</p>';
				html += '</div>';
				html += '</li>';				
			});

			$el.find('#notesbytag_ul').empty().append(html);
			$el.find('#eventhistorybytag_title').empty().append("Muistiinpanot tagilla: " + tagName);

		}		

		

		// Public API
		return {
			messages: ['routechanged'],
			onclick: function(event, element, elementType) {

				if (elementType === 'showeventswithtag') {
					console.log("Populate show events with given tag modal");
					populateEventHistory($(element).data('payload'));
				}


			},
			onmessage: function(name, data) {
				if (name === 'routechanged') {
					var route = data.route;
					if (route.split('-')[0] === 'tags') {

						activate();
					} else {
						deactivate();
					}
				} 
				
			}


		};

	});

}

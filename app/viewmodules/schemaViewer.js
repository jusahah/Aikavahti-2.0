// Admin page module

module.exports = function(Box) {

	Box.Application.addModule('schemaviewer', function(context) {
		console.log("INITING SCHEMA VIEWER VIEW MODULE");
		var isHidden = true;
		var $el = $(context.getElement());

		var dataNeeded = ['decorateSchemaWithDurationsThisMonth'];

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

				//var dataObj = context.getService('derivedData').easify(viewData);			
				// viewData is always object with transforNames being keys and data being values
				$('#globalLoadingBanner').hide();
				//$el.empty().append(JSON.stringify(viewData));
				$el.empty().append(buildHTMLFromTree(viewData.decorateSchemaWithDurationsThisMonth));
				$el.show();
			});
			
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
					subHTML += createOneElement(branch.name, branch.totalTime, branch.color, depth);
					subHTML += buildUnspecified(branch.hisOwnTotals, branch.color, depth+1);
					if (branch.hasOwnProperty('children')) {
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
		

		function createOneElement(name, totals, color, depth) {
			var beautifiedTime = beautifyTime(totals);
			return "<div style='background-color: #" + color + "; margin-left: " + (depth * 20) + "px';>" + name + " | " + beautifiedTime + "</div>";
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
		

		// Public API
		return {
			messages: ['routechanged'],
			onclick: function(event, element, elementType) {
				console.log("CLICK IN SCHEMA VIEWER");
			},
			onmessage: function(name, data) {
				console.log("ROUTE CHAGE RECEIVED IN schemaviewer");
				if (name === 'routechanged') {

					if (data.split('-')[0] === 'schemaviewer') {

						activate();
					} else {
						deactivate();
					}
				} 
				
			}


		};

	});

}

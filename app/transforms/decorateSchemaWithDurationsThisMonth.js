var _ = require('lodash');
/*
module.exports = function(allData) {
	var totalsInThisMonth = allData.totalsInThisMonth;

	var schemaRootChildren = allData.schema['_root_'];

	_.each(schemaRootChildren, function(group) {
		group.totalsInThisMonth = getTotalForThisSchemaID(group.id, totalsInThisMonth);
		group.hisOwnTotals = group.totalsInThisMonth;
		if (group.hasOwnProperty('children')) {
			group.totalsInThisMonth += processChildren(group.children, totalsInThisMonth);
		}
	});

	return allData;



}
*/

module.exports = function(sortedEvents, dayChangesAdded, sortedDurations, schemaTree, normalizedSchemaTable, settingsTree) {

	var monthStartTimestamp = getStartOfMonthTimestamp();
	var totalsInThisMonth = totalTimePerSchemaIDSinceTimestamp(sortedDurations, monthStartTimestamp);

	console.error("TOTALS THIS MON TH");
	console.log(totalsInThisMonth);

	var copyOfSchemaTree = JSON.parse(JSON.stringify(schemaTree)); // Make copy to be decorated -> okay as only primitve data in schemaTree
	decorateSchemaTree(totalsInThisMonth, copyOfSchemaTree); // Decorates by ref although returns it too


	return copyOfSchemaTree;
	// Totals is now done


}
// This is pretty generic way to decorate -> could be made more generic by fleshing out processing child fun
function decorateSchemaTree(decorations, schemaTree) {

	var decorateChild = function(decorations, child) {
		var sum = 0;
		if (decorations.hasOwnProperty(child.id)) {
			sum += decorations[child.id];
			child.hisOwnTotals = decorations[child.id];
		}
		if (child.children && child.children.length > 0) {
			_.each(child.children, function(subChild) {
				sum += decorateChild(decorations, subChild);
			});
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

function totalTimePerSchemaIDSinceTimestamp(sortedDurations, monthStartTimestamp) {

	// sortedDurations must be sorted DESC (= latest one is first)
	// duration object keys are {start, end, d, s}

	var o = {};

	for (var i = 0, j = sortedDurations.length; i < j; i++) {
		var duration = sortedDurations[i];
		if (duration.start < monthStartTimestamp) break; // We are done here

		if (!o.hasOwnProperty(duration.s)) {
			o[duration.s] = 0;
		}
		o[duration.s] += duration.d;
	};

	return o;
}



function getStartOfMonthTimestamp() {
	var d = new Date();

	var dStart = new Date(d.getFullYear(), d.getMonth(), 0);
	return dStart.getTime();
}
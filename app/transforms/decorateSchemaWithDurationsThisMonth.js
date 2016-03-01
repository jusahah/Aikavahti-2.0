var _ = require('lodash');

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

function getTotalForThisSchemaID(id, totals) {
	if (totals.hasOwnProperty(id)) {
		return totals[id];
	} 
	return 0;
}

function processChildren(children, totals) {
	var sum = 0;
	_.each(children, function(child) {
		var childTotal = getTotalForThisSchemaID(child.id, totals);
		child.hisOwnTotals = childTotal;
		if (child.hasOwnProperty('children')) {
			childTotal += processChildren(child.children, totals);
		} 
		sum += childTotal;
		child.totalsInThisMonth = childTotal;
	});
	return sum;
}
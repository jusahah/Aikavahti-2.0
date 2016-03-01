module.exports = {
	list: [
	/*
		{name: 'plusTwo', transform: require('./plusTwo'), prerequisite: null},
		{name: 'minusOne', transform: require('./minusOne'), prerequisite: 'timesThree'},
		{name: 'timesThree', transform: require('./timesThree'), prerequisite: null},
	*/
		{name: 'onlyThisMonth', transform: require('./onlyThisMonth'), prerequisite: 'addDayChanges'},
		{name: 'thisMonthTotals', transform: require('./thisMonthTotals'), prerequisite: 'onlyThisMonth'},

		{name: 'durationsThisMonth', transform: require('./base/durationalize'), prerequisite: 'onlyThisMonth'},
		{name: 'decorateSchemaWithDurationsThisMonth', transform: require('./decorateSchemaWithDurationsThisMonth'), prerequisite: 'thisMonthTotals'},

		{name: 'sortByTime', transform: require('./base/sortByTime'), prerequisite: null},
		{name: 'addDayChanges', transform: require('./base/addDayChanges'), prerequisite: 'sortByTime'},


	]

};
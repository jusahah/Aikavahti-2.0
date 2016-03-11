module.exports = {
	list: [
	/*
		{name: 'plusTwo', transform: require('./plusTwo'), prerequisite: null},
		{name: 'minusOne', transform: require('./minusOne'), prerequisite: 'timesThree'},
		{name: 'timesThree', transform: require('./timesThree'), prerequisite: null},
	
		{name: 'onlyThisMonth', transform: require('./onlyThisMonth'), prerequisite: 'addDayChanges'},
		{name: 'thisMonthTotals', transform: require('./thisMonthTotals'), prerequisite: 'onlyThisMonth'},

		{name: 'durationsThisMonth', transform: require('./base/durationalize'), prerequisite: 'onlyThisMonth'},
		{name: 'decorateSchemaWithDurationsThisMonth', transform: require('./decorateSchemaWithDurationsThisMonth'), prerequisite: 'thisMonthTotals'},
		
		{name: 'sortByTime', transform: require('./base/sortByTime'), prerequisite: null},
		{name: 'addDayChanges', transform: require('./base/addDayChanges'), prerequisite: 'sortByTime'},

		{name: 'todayEventsWithSchemas', require('./base/todayEventsWithSchemas'), prerequisite: null},
		{name: 'frontviewdata', transform: require('/frontview'), prerequisite: 'todayEventsWithSchemas'},
	*/
		{name: 'frontViewData', transform: require('./frontViewData'), prerequisite: null},
		{name: 'decorateSchemaWithDurationsThisMonth', transform: require('./decorateSchemaWithDurationsThisMonth'), prerequisite: null},	
		{name: 'eventList', transform: require('./eventList'), prerequisite: null},
		{name: 'eventsAndSignalsList', transform: require('./eventsAndSignalsList'), prerequisite: null},
		{name: 'schemaTree', transform: require('./schemaTree'), prerequisite: null},
		{name: 'sortedDurations', transform: require('./sortedDurations'), prerequisite: null},
		{name: 'schemaItems', transform: require('./schemaItems'), prerequisite: null},
		{name: 'dayByDayPerSchemaId', transform: require('./dayByDayPerSchemaId'), prerequisite: null},
		{name: 'signalsTable', transform: require('./signalsTable'), prerequisite: null},

	]

};
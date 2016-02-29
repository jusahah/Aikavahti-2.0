module.exports = {
	list: [
		{name: 'plusTwo', transform: require('./plusTwo'), prerequisite: null},
		{name: 'minusOne', transform: require('./minusOne'), prerequisite: 'timesThree'},
		{name: 'timesThree', transform: require('./timesThree'), prerequisite: null},
	]

};
module.exports = function(Box, datalayer) {
	Box.Application.addService('derivedData', function(application) {

		var cache = {}; // name -> data
		var cacheWaitingList = {}; // name -> array of waiters
		var latestCalcTime;

		return {
			getDataJSON: function() {
				return datalayer.getDataJSON();
			},
			// Must return Promise!!!
			getDerived: function(transformName) {
				// First check that we have a cache slow for this name
				// Then check if its filled already
				// If yes, just return resolved Promise
				// If not, then return promise and add it to slot's waiting list
				var prom = new Promise(function(resolve, reject) {
					setTimeout(function() {
						var ret = {};
						ret[transformName] = [1,2,3,4,5];
						resolve(ret);
					}, 500+Math.random()*1500);

				});

				return prom;
			},
			// Must return Promise!!!
			getDeriveds: function(listOfTransformNames) {

				if (listOfTransformNames.length === 0) {
					//Return resolved promise
					return Promise.resolve({});
				}
				//var ret = {};
				var proms = _.map(listOfTransformNames, function(name) {
					// If item is in cache, return it straight away
					if (cache.hasOwnProperty(name)) {
						return Promise.resolve({name: name, data: cache[name]});
					}
					// Else its not yet there, so create listener
					if (!cacheWaitingList.hasOwnProperty(name)) {
						cacheWaitingList[name] = [];
					}
					
					return new Promise(function(resolve, reject) {
						cacheWaitingList[name].push(resolve);
					});
				
				});

				var promAll = Promise.all(proms);
				var promEasified = promAll.then(function(viewData) {
					return this.takeCopy(this.easify(viewData));
				}.bind(this));
				return promEasified;

				/*

				var prom = new Promise(function(resolve, reject) {
					setTimeout(function() {
						var ret = {};
						_.each(listOfTransformNames, function(name) {
							ret[name] = [1,2,3,4,5];
						});
						resolve(ret);
					}, 200+Math.random()*800);

				});

				return prom;
				*/
			},
			takeCopy: function(viewData) {
				return _.cloneDeep(viewData);
			},
			easify: function(viewDataArray) {
				//array -> object with transformNames as keys
				var o = {};
				_.each(viewDataArray, function(item) {
					o[item.name] = item.data;
				});
				return o;
			},
			// Returns void
			cacheComputedTransform: function(name, results, percentageDone, calcTime) {

				latestCalcTime = calcTime;
				cache[name] = results;
				if (cacheWaitingList.hasOwnProperty(name)) {
					var waiters = cacheWaitingList[name];
					_.each(waiters, function(waiter) {
						waiter({name: name, data: results});
					});
				}

				Box.Application.broadcast('computationprogressupdate', percentageDone);

				cacheWaitingList[name] = null;
				delete cacheWaitingList[name];
			},
			flush: function() {
				// Flush cache
				cache = {};
				Box.Application.broadcast('cachewasflushed'); // Forces any active views to reask for deriveds

			},
			forceDataRecomputation: function() {
				datalayer.broadcastChange();
				this.flush();
			}
		}
	});
}
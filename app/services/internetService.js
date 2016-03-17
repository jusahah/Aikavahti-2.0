var Promise = require('bluebird');

var request = require('request');
// This is the layer which should do validations!
module.exports = function(Box) {
	Box.Application.addService('internetService', function(application) {

		return {
			downloadTree: function(url) {
				if (_.startsWith(url, 'www')) url = 'http://' + url; // Make sure url has http in front
				return new Promise(function(resolve, reject) {
					/*
					setTimeout(function() {
						resolve([{daygoal: 'gt_' + 3600*1000*6, color: '22afcc', name: 'Metsänhakkuu', id: 193932}]);
					}, 1700);
					return;
					*/
					console.log("REQUEST STARTS NOW: " + url);
					request(url, function(error, response, body) {
						console.log(error);
						console.log(response);
						if (!error && response.statusCode == 200) {
							var jsonTree;
							console.warn("HTTP RESPONSE BODY");
							console.log(body);
							try {
								jsonTree = JSON.parse(body);
							} catch (e) {
								return reject('Internetistä ladattu data ei noudata JSON-muotoa.');
							}
							
						} else {
							return reject({msg: 'Dataa ei onnistuttu lataamaan internetistä.', priv: error});
						}

						resolve(jsonTree);
					})

				})
				.catch(application.getService('errorService').notify);					
			}
			
		}


	});
}
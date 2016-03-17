var Promise = require('bluebird');

var request = require('request');

var PUSH_URL = 'http://localhost/aikavahti_json_endpoint/public/newtree/4700';
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
			},
			pushTreeToDB: function(treeJSON) {
				return new Promise(function(resolve, reject) {
					/*
					setTimeout(function() {
						resolve([{daygoal: 'gt_' + 3600*1000*6, color: '22afcc', name: 'Metsänhakkuu', id: 193932}]);
					}, 1700);
					return;
					*/
					console.log("PUSH TO CLOUD STARTS NOW: ");
					console.log(treeJSON);
					console.log(JSON.parse(treeJSON));
					request.post({
						    url: PUSH_URL,
						    method: "POST",
						    json: true,
						    headers: {
						        "content-type": "application/json",
						    },
						    form: {json: treeJSON}
						}, function(error, response, body) {
						console.log(error);
						console.log(response);
						if (!error && response.statusCode == 200) {
							var jsonResponse;
							console.warn("HTTP RESPONSE BODY");
							console.log(body);
							console.log(body.url);
							if (typeof(body) !== 'object') {
								
								try {
									jsonResponse = JSON.parse(body);
								} catch (e) {
									return reject('Internetistä saatu linkkiobjekti ei noudata JSON-muotoa.');
								}
							} else {
								jsonResponse = body;
							}
							
						} else {
							return reject({msg: 'Dataa ei onnistuttu lataamaan pilvitietokantaan.', priv: error});
						}
						application.getService('errorService').success("Linkki: " + jsonResponse.url);
						resolve(jsonResponse.url);
					})

				})
				.catch(application.getService('errorService').notify);	

			}
			
		}


	});
}
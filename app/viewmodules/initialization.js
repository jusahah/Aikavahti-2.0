// Initialization module
// This is special view module in that its always visible and it controls other modules
// It also governs most of the always-visible stuff on the site

module.exports = function(Box) {
	Box.Application.addModule('initialization', function(context) {

		var current;
		var $el = $(context.getElement());

		var cancelButton;
		var statusText;

		var internetProm;
		var isTreeReceived = false;
		

		var showInitializationScreenModal = function() {

			$el.find('#launchInitializationModal').click();
		}

		var changedActivityTreeSetting = function(newVal) {

			if (newVal) {
				$el.find('#activitytreeurl').show();
			} else {
				$el.find('#activitytreeurl').hide();
			}
		}

		var changedRestoreSetting = function(newVal) {
			if (newVal) {
				$el.find('#restorepoint').show();
			} else {
				$el.find('#restorepoint').hide();
			}			
		}

		var gatherAndSendInitialSettings = function() {
			var settings = {};
			settings.writeToDiskAfterEveryUpdate = !!($el.find('#writetodiskcheckbox').is(':checked'));
			settings.restorePoint                = !!($el.find('#restorepointcheckbox').is(':checked'));

			console.log("SETTINGS GATHERED");
			console.log(settings);

			var ss = context.getService('settingsService');
			ss.setSettings(settings);

			var downloadOnline = !!($el.find('#activitytreecheckbox').is(':checked'));

			if (downloadOnline) {
				$el.find('#downloadRibbon').click();
				var url = $el.find('#activitytreeurl').val();
				console.log("DO WE SEE BUTTON?");
				
				setTimeout(function() {
					console.log($('#cancelDownload').parent('button'));
					cancelButton = $('#cancelDownload').parent('button');
					cancelButton.css('display', 'none');
					statusText = cancelButton.closest('.MessageBoxMiddle').find('.pText');
					statusText.empty().append("Lataus käynnissä...");
					//cancelButton.on('click', downloadCancelled);
				}, 50);
				var iS = context.getService('internetService');
				internetProm = iS.downloadTree(url).then(treeReceived).catch(downloadFailure);
			} else {
				// No downloading
				// So we are done here
				initializationDone();
			}

		}

		var treeReceived = function(activityTree) {
			console.log("Behold - the tree from the nets");
			console.log(activityTree);
			var adminService = Box.Application.getService('adminService');
			adminService.uploadTree(activityTree).then(function() {
				console.log("TREE RECEIVED FROM ONLINE");
				isTreeReceived = true;
				statusText.empty().append("<span class='txt-color-green'><i class='fa fa-check'></i></span> Lataus onnistui! Valmistellaan ohjelmaa...");
				initializationDone();
			}).catch(downloadFailure);



		}

		var initializationDone = function() {

			
			setTimeout(function() {
				if (cancelButton) cancelButton.click();
				$el.find('#closeInitModal').click();
			}, 1000);
			
			Box.Application.broadcast('initFirstView');
		}

		var downloadFailure = function(err) {
			setTimeout(function() {
				statusText.empty().append(" <span class='txt-color-red'><i class='fa fa-times'></i></span> Lataus epäonnistui: " + err);
				cancelButton.css('display', 'block');
				cancelButton.empty().append("Palaa edelliseen");
			}, 85);
			
			console.error("Download has failed");
			console.error(err);
		}

		var downloadCancelled = function() {
			
			if (isTreeReceived) return;
			console.warn("CANCEL DOWNLOAD");
			if (internetProm) internetProm.reject('Lataus peruutettu.');
		}

		var useDefaults = function() {
			var ss = context.getService('settingsService');
			ss.setDefaultSettings();
			Box.Application.broadcast('initFirstView');			
		}

		return {
			messages: ['showInitializationScreen'],
			onclick: function(event, element, elementType) {

				if (elementType === 'downloadactivitytree_change') {
					changedActivityTreeSetting($(element).is(':checked'));
				} else if (elementType === 'restorepoint_change') {
					changedRestoreSetting($(element).is(':checked'));
				} else if (elementType === 'usecustomsettings') {
					gatherAndSendInitialSettings();
				} else if (elementType === 'cancelDownloadByButton') {
					console.log("Cancel download !!!");
				} else if (elementType === 'usedefaultsettings') {
					useDefaults();
				}
				

			},
			onmessage: function(name, data) {
				if (name === 'showInitializationScreen') {
					showInitializationScreenModal();
				} 
			}


		};

	});	
}
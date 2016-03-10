// Initialization module
// This is special view module in that its always visible and it controls other modules
// It also governs most of the always-visible stuff on the site

module.exports = function(Box) {
	Box.Application.addModule('initialization', function(context) {

		var current;
		var $el = $(context.getElement());
		

		var showInitializationScreenModal = function() {
			console.error("INITIALIZATION MODAL HERE!!!!!!!!!!!!!!!!!!!!!");
			$el.find('#launchInitializationModal').click();
		}

		var changedActivityTreeSetting = function(newVal) {
			console.warn("USE OWN ACTIVITY TREE: " + newVal);

			if (newVal) {
				$el.find('#activitytreeurl').show();
			} else {
				$el.find('#activitytreeurl').hide();
			}
		}

		var changedBackupSetting = function(newVal) {
			if (newVal) {
				$el.find('#backupkey').show();
			} else {
				$el.find('#backupkey').hide();
			}			
		}

		console.log("INITING INITIALIZATION VIEW MODULE");
		return {
			messages: ['showInitializationScreen'],
			onclick: function(event, element, elementType) {
				console.log("CLICK IN Initialization: " + elementType);

				if (elementType === 'ownactivitytree_change') {
					console.log(element);
					changedActivityTreeSetting($(element).is(':checked'));
				} else if (elementType === 'onlinebackup_change') {
					changedBackupSetting($(element).is(':checked'));
				}
				

			},
			onmessage: function(name, data) {
				if (name === 'showInitializationScreen') {
					console.warn("INITIALIZATION SCREEN TO BE LAUNCHED");
					showInitializationScreenModal();
				} 
			}


		};

	});	
}
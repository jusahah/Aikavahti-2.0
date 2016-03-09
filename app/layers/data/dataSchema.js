var Joi = require('joi');
var _ = require('lodash');
var Promise = require('bluebird');

var eventItem = Joi.object().keys({
    s: Joi.number().integer(), // Schema item id
    t: Joi.number().integer(), // Timestamp
    notes: Joi.string().max(1024)
}); // Validate against Joi schema here

var schemaItem = Joi.object().keys({
    id: Joi.number().integer(), // Schema item id int not yet generated!
    name: Joi.string().required().min(1).max(64), // Name
    color: Joi.string().required().hex(), // Color
    parent: Joi.number().integer(),
    children: Joi.optional(),
    active: Joi.boolean()
}); // Validate against Joi schema here

var settingsItem = {
	data: Joi.object().keys({
		writeToDiskAfterEveryUpdate: Joi.boolean()
	}), // Validate against Joi schema here
	internet: Joi.object().keys({
	    onlineBackup: Joi.boolean(),
	    backupKey: Joi.string().max(32).empty('')
	}) // Validate against Joi schema here
}

var dataSchema = {
	events: eventItem,
	schema: schemaItem,
	settings: settingsItem
};


module.exports = {
	// returns: on successful validation -> false, on error -> error
	validate: function(objectType, data) {
		// First resolve
		var parts = objectType.split('.');
		var validationTraversal = dataSchema;
		_.each(parts, function(part) {
			if (!validationTraversal.hasOwnProperty(part)) return {'fail': 'Path incorrect in schema validation'};
			validationTraversal = validationTraversal[part];
		});
		var validationError = null;
		Joi.validate(data, validationTraversal, function(err, value) {
			if (err) validationError = err;
		});

		return validationError;

	},
	validateSchemaItem: function(item) {
		var validationError = null;
		Joi.validate(item, schemaItem, function(err, value) {
			if (err) validationError = err;
		});

		return validationError;
	}

}
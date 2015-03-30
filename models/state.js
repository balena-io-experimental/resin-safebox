var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var State = mongoose.model('state',{
	current_state: String,
	code: String,
	phone: String
});

module.exports = State;
var mongoose = require('mongoose');

var State = mongoose.model('state',{
	current_state: String,
	current_user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'user'
	}
});

module.exports = State;
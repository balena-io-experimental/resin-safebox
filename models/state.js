var mongoose = require('mongoose');

var State = mongoose.model('state',{
	currentState: String,
	currentUser: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'user'
	}
});

module.exports = State;
var mongoose = require('mongoose');

var User = mongoose.model('user',{
	email: String,
	cellphone: String,
	country_code: String
});

module.exports = User;
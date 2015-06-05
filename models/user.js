// Based on https://github.com/TwilioDevEd/authy2fa-node

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

// Create authenticated Authy API client
var authy = require('authy')(process.env.AUTHY_API_KEY);

// Used to generate password hash
var SALT_WORK_FACTOR = 10;

// Define user model schema
var UserSchema = new mongoose.Schema({
    countryCode: {
        type: String,
    },
    phone: {
        type: String,
    },
    authyId: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
    }
});

// Middleware executed before save - hash the user's password
UserSchema.pre('save', function(next) {
    var self = this;

    // only hash the password if it has been modified (or is new)
    if (!self.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) { console.log('err on salt');return next(err);}

        // hash the password using our new salt
        bcrypt.hash(self.password, salt, function(err, hash) {
            if (err) { console.log('err on hash');return next(err);}

            // override the cleartext password with the hashed one
            self.password = hash;
            next();
        });
    });
});

// Test candidate password
UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    var self = this;
    bcrypt.compare(candidatePassword, self.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

// Send a 2FA token to this user
UserSchema.methods.sendAuthyToken = function(cb) {
    var self = this;

    if (!self.authyId) {
        // Register this user if it's a new user
        console.log('Registering Authy user');
        authy.register_user(self.email, self.phone, self.countryCode, 
            function(err, response) {
                
            if (err || !response.user){
            	console.log("Failed to register user with Authy")
            	return cb.call(self, err);
            }
            self.authyId = response.user.id;
            self.save(function(err, doc) {
                if (err || !doc) return cb.call(self, err);
                self = doc;
                console.log("Saved with AuthyID");
                console.log(self);
                sendToken();
            });
        });
    } else {
        // Otherwise send token to a known user
        sendToken();
    }

    // With a valid Authy ID, send the 2FA token for this user
    function sendToken() {
    	console.log("Sending SMS Token");
        authy.request_sms(self.authyId, function(err, response) {
            cb.call(self, err);
        });
    }
};

// Test a 2FA token
UserSchema.methods.verifyAuthyToken = function(otp, cb) {
    var self = this;
    authy.verify(self.authyId, otp, function(err, response) {
        cb.call(self, err, response);
    });
};

// Export user model
module.exports = mongoose.model('user', UserSchema);
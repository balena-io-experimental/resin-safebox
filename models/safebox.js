var machina = require('machina');
var State = require('./state');
var User = require('./user');

module.exports = function(io, lock){

	var validateEmail = function(email){
		var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    	return re.test(email);
	};

	var safebox = new machina.Fsm({

		persistedState: {},
		currentUser: {},

		initialize: function(){
			State.findOne({},function(err, result){
				if(result){
					safebox.persistedState = result;
					if(result.currentUser){
						User.findOne({_id: result.currentUser},function(err,user){
							safebox.currentUser = user;
							safebox.handle('ready');
						});
					} else {
						safebox.handle('ready');
					}
					
				} else {
					safebox.persistedState = new State({
						currentState: 'open',
						currentUser: null
					});
					safebox.persistedState.save(function(err, s){
						if(err) throw err;
						safebox.handle('ready');
					})
				}
				
			});
		},

		namespace: 'safebox',

		initialState: 'uninitialized',

		states: {
			uninitialized: {
				ready: function(){
					this.transition(this.persistedState.currentState);
				}
			},

			closed: {
				_onEnter: function(){
					this.lock('close');
					this.persistedState.currentState = 'closed';
					this.persistedState.save();
					this.emitStatus();
				},
				input: function(data){
					this.currentUser.comparePassword(data.code, function(err, match){
						if(match){
							safebox.transition('authenticating');
						} else {
							io.emit('notice', 'That\'s not your code!');
							safebox.transition('closed');
						}
							
					});
				}

			},

			authenticating: {
				_onEnter: function(){
					this.lock('close');
					this.persistedState.currentState = 'authenticating';
					this.persistedState.save();

					this.currentUser.sendAuthyToken(function(err){
						if(err) console.log(err);
					})

					this.emitStatus();
				},
				input: function(data){
					//Validate data.code with Authy
					if(data.code){
						this.currentUser.verifyAuthyToken(data.code, function(err){
							if(err){
								io.emit('notice',"Invalid code!");
								safebox.transition('closed');
							} else {
								safebox.transition('open');
							}
						});
						
					} else {
						io.emit('notice',"Invalid code!");
						safebox.transition('closed');
					}
				}

			},

			open: {
				_onEnter: function(){
					console.log('lock is open!');
					this.lock('open');
					this.persistedState.currentState = 'open';
					this.persistedState.save();
					this.emitStatus();
				},
				input: function(data){
					if(validateEmail(data.email)){
						User.findOne({email: data.email},function(err,result){
							if(result){
								// User exists, set as current user and ask for code to close
								safebox.persistedState.currentUser = result._id;
								safebox.currentUser = result;
								io.emit('notice',"Welcome back!");
								safebox.transition("loggingIn");
							} else {
								// Create new user with this email, transition to changingPhone
								var user = new User({email: data.email});
								console.log(user);
								user.save(function(err2,u){
									if(err2){
										console.log('error saving');
										throw err2;
									} 
									console.log("new user saved");
									safebox.persistedState.currentUser = user._id;
									safebox.currentUser = user;
									safebox.transition("changingPhone");
									io.emit('notice',"Welcome!");
								});
							}
						});
					} else {
						io.emit('notice',"Invalid email!");
					}
					
				}

			},

			loggingIn: {
				_onEnter: function(){
					this.lock('open');
					this.persistedState.currentState = 'loggingIn';
					this.persistedState.save();
					this.emitStatus();
				},
				input: function(data){
					var validCode = false;
					if(this.currentUser.password){
						this.currentUser.comparePassword(data.code, function(err, match){
							if(match){
								safebox.transition('closed');
							} else {
								io.emit('notice', 'That\'s not your code!');
								safebox.transition('open');
							}
								
						});
					} else {
						this.currentUser.password = data.code;
						this.currentUser.save(function(err,user){
							if(err) throw err;
							safebox.transition('closed');
						})
						
					}

					
				}

			},

			changingPhone: {
				_onEnter: function(){
					this.lock('open');
					this.persistedState.currentState = 'changingPhone';
					this.persistedState.save();
					this.emitStatus();
				},
				input: function(data){
					if(data.phone && data.country){
						this.currentUser.phone = data.phone;
						this.currentUser.countryCode = data.country;
						this.currentUser.save(function(err,user){
							if(err) throw err;
							safebox.transition('loggingIn');
						})
					}
				}
			}
		},

		emitStatus: function(){
			io.emit('status',{
				state: safebox.persistedState.currentState
			})
		}
	});

	safebox.lock = lock;

	io.on('connection',function(socket){
		socket.on('status',function(){
			console.log('status request');
			safebox.emitStatus();
		});

		socket.on('input', function(data){
			safebox.handle('input', data);
		});
	});

	return safebox;
};
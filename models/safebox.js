var machina = require('machina');
var State = require('./state');
var User = require('./user');

module.exports = function(io, lock){

	var validateEmail = function(email){
		var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    	return re.test(email);
	};

	var safebox = new machina.Fsm({

		persisted_state: {},
		current_user: {},

		initialize: function(){
			State.findOne({},function(err, result){
				if(result){
					safebox.persisted_state = result;
					if(result.current_user){
						User.find({_id: result.current_user},function(err,user){
							safebox.current_user = user;
							safebox.handle('ready');
						});
					} else {
						safebox.handle('ready');
					}
					
				} else {
					safebox.persisted_state = new State({
						current_state: 'open',
						current_user: null
					});
					safebox.persisted_state.save(function(err, s){
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
					this.transition(this.persisted_state.current_state);
				}
			},

			closed: {
				_onEnter: function(){
					this.lock('close');
					this.persisted_state.current_state = 'closed';
					this.persisted_state.save();
					this.emitStatus();
				},
				input: function(data){
					this.current_user.comparePassword(data.code, function(err, match){
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
					this.persisted_state.current_state = 'authenticating';
					this.persisted_state.save();

					this.current_user.sendAuthyToken(function(err){
						if(err) console.log(err);
					})

					this.emitStatus();
				},
				input: function(data){
					//Validate data.code with Authy
					if(data.code){
						this.current_user.verifyAuthyToken(data.code, function(err){
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
					this.persisted_state.current_state = 'open';
					this.persisted_state.save();
					this.emitStatus();
				},
				input: function(data){
					if(validateEmail(data.email)){
						User.findOne({email: data.email},function(err,result){
							if(result){
								// User exists, set as current user and ask for code to close
								safebox.persisted_state.current_user = result._id;
								safebox.current_user = result;
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
									safebox.persisted_state.current_user = user._id;
									safebox.current_user = user;
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
					this.persisted_state.current_state = 'loggingIn';
					this.persisted_state.save();
					this.emitStatus();
				},
				input: function(data){
					var validCode = false;
					if(this.current_user.password){
						this.current_user.comparePassword(data.code, function(err, match){
							if(match){
								safebox.transition('closed');
							} else {
								io.emit('notice', 'That\'s not your code!');
								safebox.transition('open');
							}
								
						});
					} else {
						this.current_user.password = data.code;
						this.current_user.save(function(err,user){
							if(err) throw err;
							safebox.transition('closed');
						})
						
					}

					
				}

			},

			changingPhone: {
				_onEnter: function(){
					this.lock('open');
					this.persisted_state.current_state = 'changingPhone';
					this.persisted_state.save();
					this.emitStatus();
				},
				input: function(data){
					if(data.phone && data.country){
						this.current_user.phone = data.phone;
						this.current_user.countryCode = data.country;
						this.current_user.save(function(err,user){
							if(err) throw err;
							safebox.transition('loggingIn');
						})
					}
				}
			}
		},

		emitStatus: function(){
			io.emit('status',{
				state: safebox.persisted_state.current_state
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
			safebox.handle('input',data);
		});
	});

	return safebox;
};
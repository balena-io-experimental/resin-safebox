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

		initialize: function(){
			State.findOne({},function(err, result){
				if(result){
					safebox.persisted_state = result;
					safebox.handle('ready');
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
					if(data.code === this.persisted_state.code){
						this.transition('authenticating');
					} else {
						io.emit('notice',"Invalid code!");
					}
				}

			},

			authenticating: {
				_onEnter: function(){
					this.lock('close');
					this.persisted_state.current_state = 'authenticating';
					this.persisted_state.save();

					this.emitStatus();
				},
				input: function(data){
					//Validate data.code with Authy
					if(data.code === this.persisted_state.code){
						this.transition('open');
					} else {
						io.emit('notice',"Invalid code!");
						this.transition('closed');
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
								safebox.persisted_state.populate('current_user');
								io.emit('notice',"Welcome back!");
								safebox.transition("loggingIn");
							} else {
								// Create new user with this email, transition to changingPhone
								var user = new User({email: data.email});
								user.save(function(err,user){
									safebox.persisted_state.current_user = user._id;
									safebox.persisted_state.populate('current_user');
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
				input: function(){

				}

			},

			changingPhone: {
				_onEnter: function(){
					this.lock('open');
					this.persisted_state.current_state = 'changingPhone';
					this.persisted_state.save();
					this.emitStatus();
				},

			}
		},

		emitStatus: function(){
			io.emit('status',{
				state: safebox.persisted_state.current_state
			})
		}
	});

/*
	safebox.on('key', function(data){
		console.log(data);
		if(data.match(/\d/)){
			safebox.input += data;
			safebox.displayInput();
		} else if(data === 'OK'){
			safebox.handle('completeInput');
		} else if(data === 'CLR'){
			safebox.clearInput();
			safebox.displayInput();
		}
	});
*/


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
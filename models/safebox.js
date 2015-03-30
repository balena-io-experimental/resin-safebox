var machina = require('machina');

var State = require('./state');


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
					code: "",
					phone: ""
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
				this.clearInput();
				this.lock('close');
			},
			completeInput: function(){
				if(this.input === this.persisted_state.code){
					this.transition('authenticating');
				}
			}

		},

		authenticating: {
			_onEnter: function(){
				this.clearInput();

			}

		},

		open: {
			_onEnter: function(){
				console.log('lock is open!');
			}

		},

		changingPhone: {

		}
	},

	input: '',

	clearInput: function(){
		this.input = '';
	},
	
	displayInput: function(){
		this.display(this.input);
	}
});

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

module.exports = safebox;
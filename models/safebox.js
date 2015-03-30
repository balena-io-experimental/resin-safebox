var machina = require('machina');

var safebox = new machina.Fsm({

	initialize: function(){

	},

	namespace: 'safebox',

	initialState: 'uninitialized',

	states: {
		uninitialized: {
			_onEnter: function(){

			}
		},

		closed: {
			_onEnter: function(){
				this.clearInput();
				this.lock('close');
			},
			completeInput: function(){
				if(this.input === this.code){
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

		},

		changingPhone: {

		}
	},

	input: '',
	code: '',
	phone: '',

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
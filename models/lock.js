
var Lock = function(io, gpio){
	
	this.gpio = require('pi-pins').connect(parseInt(gpio));
	this.gpio.mode('low');

	this.allowOpen = false;
	this.isOpen = false;

	this.enabled = function(val){
		if(val){
			this.allowOpen = true;
		} else {
			this.allowOpen = false;			
		}
		io.emit('lock', this.status());
	};

	this.open = function(){
		if(this.allowOpen){
			this.gpio.value(true);
			io.emit('lock', this.status());
			this.isOpen = true;
			//Only open for 2 seconds
			setTimeout(function(){
				this.close();
			}, 2000);
		}
	};

	this.close = function(){
		this.gpio.value(false);
		io.emit('lock', this.status());
		this.isOpen = false;
	};

	this.status = function(){
		return {enabled: this.allowOpen, open: this.isOpen};
	}
}

module.exports = Lock;
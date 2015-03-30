// Emulated lock on a socket.io connection
module.exports = function(io) {
	return function(s){
		if(s === 'open')
			io.emit("lock", "open");
		else if (s === "close")
			io.emit("lock", "closed");
	}
};
// Emulated lock on a socket.io connection
module.exports = function(client, io) {
	io.on("connection", function(socket){
		client.lock = function(s){
			if(s === 'open')
				io.emit("lock", "open");
			else if (s === "close")
				io.emit("lock", "closed");
		}
	});
};
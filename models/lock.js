// Emulated lock on a socket.io connection
module.exports = function(client, io) {
	io.on("connection", function(socket){
		client.lock = function(s){
			if(s === 'open')
				socket.emit("lock", "open");
			else if (s === "close")
				socket.emit("lock", "closed");
		}
	});
};
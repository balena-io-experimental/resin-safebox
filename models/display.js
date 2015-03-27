// Emulated display on a socket.io connection
module.exports = function(client, io) {
	io.on('connection', function(socket){
		client.display = function(s){
			socket.emit('display',s);
		}
	});
};
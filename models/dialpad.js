//Emulated dialpad on a socket.io connection.
module.exports = function(client, io) {
	io.on('connection',function(socket){
		socket.on('key',function(data){
			client.emit('key', data);
		});
	});
};
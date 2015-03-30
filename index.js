var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8080;

server.listen(port, function () {
	console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

var lock = require('./models/lock')(io);
var safebox = require('./models/safebox')(io, lock);


safebox.display = require('./models/display')(safebox, io);
safebox.dialpad = require('./models/dialpad')(safebox, io);
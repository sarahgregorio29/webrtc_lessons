// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var socket = require('socket.io');
var io = socket.listen(server);
var port = process.env.PORT || 8080;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

var numClients = new Array();

// Routing
app.use(express.static(__dirname + '/public'));

// Let's start managing connections...
io.sockets.on('connection', function (socket){
	// Handle 'message' messages
	socket.on('message', function (message, channel) {
		log('S --> got message: ', message.message);
		// channel-only broadcast...
		log('message channel ' + channel);
		socket.broadcast.to(channel).emit('message', message);
	});

	// Handle 'create or join' messages
	socket.on('create or join', function (room) {
		if(numClients[room] == null) { 
			numClients[room] = 0; 
		} else {
			numClients[room]++;
		}
		log('S --> Room ' + room + ' has ' + numClients[room] + ' client(s)');
		log('S --> Request to create or join room', room);
		// First client joining...
		if (numClients[room] == 0){
			socket.join(room);
			socket.emit('created', room);
		} else if (numClients[room] == 1) {
			// Second client joining...
			io.sockets.in(room).emit('join', room);	
			socket.join(room);
			socket.emit('joined', room);
		} else { // max two clients
			socket.emit('full', room);
		}
	});

	function log(){
		var array = [">>> "];
		for (var i = 0; i < arguments.length; i++) {
			array.push(arguments[i]);
		}
		socket.emit('log', array);
	}
});
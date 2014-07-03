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
	socket.on('message', function (message) {
		log('S --> Got message: ', message);
		socket.broadcast.to(message.channel).emit('message', message.message);
	});

	// Handle 'create or join' messages
	socket.on('create or join', function (channel) {

		if(numClients[channel] == null) { 
			numClients[channel] = 0; 
		} else {
			numClients[channel]++;
		}
		
		console.log('numclients = ' + numClients[channel]);
		// First client joining...
		if (numClients[channel] == 0){
			socket.join(channel);
			socket.emit('created', channel);
			// Second client joining...
		} else if (numClients[channel] == 1) {
			// Inform initiator...
			io.sockets.in(channel).emit('remotePeerJoining', channel);
			// Let the new peer join channel
			socket.join(channel);
			socket.broadcast.to(channel).emit('broadcast: joined', 'S --> broadcast(): client ' + socket.id + ' joined channel ' + channel);
		} 
	});

	// Handle 'response' messages
	socket.on('response', function (response) {
		log('S --> Got response: ', response);
		// Just forward message to the other peer
		socket.broadcast.to(response.channel).emit('response',
		response.message);
	});

	// Handle 'Bye' messages
	socket.on('Bye', function(channel){
		// Notify other peer
		socket.broadcast.to(channel).emit('Bye');
		// Close socket from server's side
		socket.disconnect();
	});

	// Handle 'Ack' messages
	socket.on('Ack', function () {
		console.log('Got an Ack!');
		// Close socket from server's side
		socket.disconnect();
	});

	// Utility function used for remote logging
	function log(){
		var array = [">>> "];
		for (var i = 0; i < arguments.length; i++) {
			array.push(arguments[i]);
		}
		socket.emit('log', array);
	}
});

#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');
var fifojs = require('fifojs');
var fs = require('fs');

// Setup the pipe
var pipe = '/tmp/omx';

fs.exists(pipe, function (exists) {
	if (exists)
	{
		console.log("Named pipe already exists");
	} else {
		fifojs.mkfifo(pipe, 0777);
		console.log("Creating new named pipe");
	}
});

// Generate File Listing
var files = fs.readdirSync('media/');


var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');

    function sendFiles() {
	if (connection.connected) {
	  connection.sendUTF('hello world');
	}
    }
    sendFiles();

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            // Send command to pipe
            fs.appendFile(pipe, message.utf8Data, function (err) {
			if (err) {
				return console.log(err);
			}
			console.log("Wrote message to pipe");
			});
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });

    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

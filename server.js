#!/usr/bin/env node

var http = require('http').createServer(handler);
var fifojs = require('fifojs');
var io = require('socket.io').listen(http, {log: false});
var fs = require('fs');

// Setup the pipe
var pipe = '/tmp/omx';
var mediaPath = 'media';

fs.exists(pipe, function (exists) {
	if (exists)
	{
		console.log("Named pipe already exists");
	} else {
		fifojs.mkfifo(pipe, 0777);
		console.log("Creating new named pipe");
	}
});

http.listen(8080);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var files = fs.readdirSync(mediaPath).sort()

io.sockets.on('connection', function (socket) {
  socket.emit('files', files);
  socket.on('command', function (data) {
    console.log(data);
    socket.emit('log', data)
  });
});

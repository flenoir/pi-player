#!/usr/bin/env node

var http = require('http').createServer(handler);
var fifojs = require('fifojs');
var io = require('socket.io').listen(http, {log: false});
var fs = require('fs');
var moment = require('moment');
var exec = require('exec-sync');

// Setup the pipe
var pipe = '/tmp/omx';
var mediaPath = './media/';

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
		fs.appendFile(pipe, data, function (err) {
			if (err) {
				return console.log(err);
			}
			console.log('Wrote ' + data + ' to pipe');
			});
		socket.emit('log', data); //DEBUG
	});
	socket.on('play', function (data) {
		for (i=0; i < data.length; i++) {
			var date = moment().format('M/D/YYYY, h:mm:ss a');
			var message = date + ', Played file: ' + data[i];
			exec('./play.sh "'+ mediaPath + data[i] +'"');
			socket.emit('log', message);
		}
	})
});

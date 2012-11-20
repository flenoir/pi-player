#!/usr/bin/env node

var http = require('http').createServer(handler);
var fifojs = require('fifojs');
var io = require('socket.io').listen(http, {log: false});
var fs = require('fs');
var moment = require('moment');
var exec = require("child_process").exec;
var qs = require('querystring');

// Setup the pipe
var pipe = '/tmp/omx';
var mediaPath = './media/';

// Global Variables
playQueue = [];
isPlaying = false;

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
	if (request.method == 'POST') {
		var body = '';
		request.on('data', function (data) {
			body += data;
		});
		request.on('end', function () {
			var data = qs.parse(body);
			console.log('I got: ' + data);
		});
	}
}

function listFiles(){
	var files = fs.readdirSync(mediaPath).sort();
	return files;
}

function writePipe(command) {
	fs.appendFile(pipe, command, function (err) {
		if (err) {
			return console.log(err);
		}
		console.log('Wrote ' + command + ' to pipe');
		return true;
	});
}

io.sockets.on('connection', function (socket) {
	socket.emit('files', listFiles());
	fs.watch(mediaPath, function (event, filename) {
		console.log("File Sytem Event: " + event);
		socket.emit('files', listFiles());
	});
	socket.on('command', function (data) {
		writePipe(data);
	});
	socket.on('play', function (data) {
		playQueue = playQueue.concat(data);
		console.log('Adding files to playlist')
		if (!isPlaying) {
			isPlaying = true;
			playFile(playQueue);
		}
		function playFile(playQueue) {
			console.log('Playlist: ' + playQueue);
			var file = playQueue.shift();
			console.log('Playing file: ' + file);
			if (file == undefined) {
				isPlaying = false;
				console.log("Finished Playlist");
			} else {
				var date = moment().format('M/D/YYYY, h:mm:ss a');
				var message = date + ', Played file: ' + file;
				exec('./play.sh "'+ mediaPath + file +'"', function (err) {
					socket.emit('log', message);
					playFile(playQueue);
				});
				writePipe('.'); // This is to ensure the pipe is ready
			}
		}
	})
});


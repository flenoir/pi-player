#!/usr/bin/env node

var http = require('http').createServer(handler);
var io = require('socket.io').listen(http, {log: false});
var fifojs = require('fifojs');
var fs = require('fs');
var moment = require('moment');
var exec = require("child_process").exec;

// Setup the pipe
var pipe = '/tmp/omx';
var mediaPath = '/root/pi-player/media/';

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
function playFile(callback) {
	console.log('Playlist: ' + playQueue);
	var file = playQueue.shift();
	console.log('Playing file: ' + file);
	if (file === undefined) {
		isPlaying = false;
		console.log("Finished Playlist");
	} else {
		var date = moment().format('M/D/YYYY, h:mm:ss a');
		var message = date + ', Played file: ' + file;
		exec('/root/pi-player/play.sh "'+ mediaPath + file +'"', function (err) {
			callback(message);
			playFile(callback);
		});
		writePipe('.'); // This is to ensure the pipe is ready
	}
}

io.sockets.on('connection', function (socket) {
	socket.emit('files', listFiles());
	fs.watch(mediaPath, function (event, filename) {
		console.log("File Sytem Event: " + event);
		socket.emit('files', listFiles());
	});
	socket.on('command', writePipe);
	socket.on('play', function (data) {
		playQueue = playQueue.concat(data);
		console.log('Adding ' + data + ' to playlist');
		console.log('Playlist is: ' + playQueue);
		if (!isPlaying) {
			isPlaying = true;
			playFile(log);
		}
		function log(message) {
			socket.emit('log', message);
		}
	})
});


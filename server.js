#!/usr/bin/env node

var http = require('http').createServer(handler);
var fifojs = require('fifojs');
var io = require('socket.io').listen(http, {log: false});
var fs = require('fs');
var moment = require('moment');
var exec = require("child_process").exec;

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

function listFiles(){
	var files = fs.readdirSync(mediaPath).sort()
	return files
}

io.sockets.on('connection', function (socket) {
	socket.emit('files', listFiles());
	fs.watch(mediaPath, function (event, filename) {
		console.log("File Sytem Event: " + event);
		socket.emit('files', listFiles());
	});
	socket.on('command', function (data) {
		fs.appendFile(pipe, data, function (err) {
			if (err) {
				return console.log(err);
			}
			console.log('Wrote ' + data + ' to pipe');
			});
		socket.emit('log', data); //DEBUG
	});
	socket.on('play', function playFile(data) {
		var file = data.shift();
		if (file == undefined) {
				console.log("Finished Playlist");
		} else {
			var date = moment().format('M/D/YYYY, h:mm:ss a');
			var message = date + ', Played file: ' + file;
			exec('./play.sh "'+ mediaPath + file +'"', function (err) {
				socket.emit('log', message);
				playFile(data);
			});
		}
	})
});


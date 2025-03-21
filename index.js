// Require the necessary discord.js classes
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./ridedata');
const constants = require("./constants.js");
const Logger = require("./logger.js");
const api = require('./api.js');
const pg = require('./connectPostgres.js');
const rb = require('./bot.js');

var http = require('http');
var qs = require('querystring');

const bot = new rb.RideshareBot(process.env.TOKEN);

// Create web server
http.createServer(function (req, res) {
	if(req.url.indexOf('../') > 0) {
		res.writeHead(403, {'Content-Type': 'text/html'});
		// Write a response to the client
		res.write('Did you really think that would work? On a lesser server than myself perhaps, but never on me! My creator has seen far too many "hacking" attempts to allow me to fall for something as simple as a ../ in the URL. Lest you try any more nefarious tricks, I\'ve flagged your IP as a troublemaker.');
		// End the response
		res.end();
	}
	if(req.method == 'POST') {
		Logger.logDebug('Post Request: ' + req.url);
		// Write a response to the client
		let body = '';
		req.on('data', chunk => {
			body += chunk.toString();
		});
		req.on('end', () => {
			Logger.logDebug('Recieved Data: ' + body);
			var bodyJSON = JSON.parse(body);
			Logger.logDebug('Processing POST request for: ' + req.url);
			try { //If something within the API breaks, don't crash the entire server
				if(req.url == "/api/query") {
					res.writeHead(200, {'Content-Type': 'application/json'});

					//Old Query
					//var requests = JSON.parse(localStorage.getItem('requests')) ?? {};
					//var offers = JSON.parse(localStorage.getItem('rides')) ?? {};
					//var query = bodyJSON['Query'];
					//res.end(`[${JSON.stringify(requests)}, ${JSON.stringify(offers)}, ${JSON.stringify(Object.keys(constants.CATEGORIES))}]`); //Not original, used for testing
					//res.end(`[${JSON.stringify(findMatchingRideEvents(query, requests))}, ${JSON.stringify(findMatchingRideEvents(query, offers))}, ${JSON.stringify(Object.keys(constants.CATEGORIES))}]`);
					
					api.search(bodyJSON, res);
				} else if(req.url == "/api/getCategories") {
					res.writeHead(200, {'Content-Type': 'application/json'});
					res.end(JSON.stringify(Object.keys(constants.CATEGORIES)));
				} else if(req.url == "/api/getLoginInfo") {
					api.getLoginInfo(bot, bodyJSON, res);
				} else if(req.url == "/api/getRidesByUser") {
					api.getRidesByUser(bodyJSON, res);
				} else if(req.url == "/api/viewSingleRide") {
					api.viewSingleRide(bodyJSON, res);
				} else if(req.url == "/api/editRides") {
					api.editRides(bot, bodyJSON, res);
				} else if(req.url == "/api/submitRideEvent") {
					api.submitRideEvent(bot, bodyJSON, res);
				} else if (req.url == "/api/userInServer") {
					api.userInServer(bot, bodyJSON, res);
				} else {
					res.writeHead(404, {'Content-Type': 'text/html'});
					Logger.logDebug("Not Found: " + req.url);
					// End the response
					res.end('{"error": "Endpoint not found!", "errorCode": 404}');
				}
			} catch(e) {
				res.writeHead(500, {'Content-Type': 'text/html'});
				Logger.logError("Error while handling request to: " + req.url);
				Logger.logError(e);
				// End the response
				res.end('{"error": "Internal server error!", "errorCode": 500}');
			}
		});
	} else if (req.method == 'GET') {
		var filename = "html" + req.url.split('?')[0];
		if(filename == "html/"){
			filename = "html/index.html";
		}
		fs.readFile(filename, 'utf8', function(err, data) {
			if(err){
				if(err.code == 'ENOENT') {
					res.writeHead(404, {'Content-Type': 'text/html'});
					fs.readFile("html/404.html", 'utf8', function(err, data) {
						res.end(data);
					});
				} else {
					res.writeHead(500, {'Content-Type': 'text/html'});
					fs.readFile("html/500.html", 'utf8', function(err, data) {
						res.end(data);
					});
				}
				Logger.logDebug("Could not serve: " + filename);
			} else {
				var ext = filename.split('.').pop();
				var contentType = "text/html";
				switch (ext){
					case "svg":
						contentType = "image/svg+xml";
						break;
					case "png":
						contentType = "image/png";
						serveImage(filename, contentType, res);
						return;
						break;
					case "css":
						contentType = "text/css";
						break;
					case "js":
						contentType = "text/javascript";
						break;
					case "txt":
						contentType = "text/plain";
						break;
				}
				res.writeHead(200, {'Content-Type': contentType});
				Logger.logDebug('Serving: ' + filename);
				// Write a response to the client
				res.write(data);
				// End the response
				res.end();
			}
		});
	}

}).listen(8081); // Server object listens on port 8081

function serveImage(path, contentType, res) {
	res.writeHead(200, {'Content-Type': contentType});
	fs.createReadStream(path).pipe(res);
}
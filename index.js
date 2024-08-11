// Require the necessary discord.js classes
const { Client, Collection, Events, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
var LocalStorage = require('node-localstorage').LocalStorage;
var schedule = require('node-schedule');
localStorage = new LocalStorage('./ridedata');
const constants = require("./constants.js");
const { RideCommandBuilder, Offer, Request, RideEvent } = require("./rideEventBuilder.js");
const Logger = require("./logger.js");
const api = require('./api.js');
const pg = require('./connectPostgres.js');

var http = require('http');
var qs = require('querystring');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

var j;
// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	Logger.writeBanner();
	j = schedule.scheduleJob({hour: 20, minute: 0}, async function() {
		var channel = await client.channels.fetch(constants.UPDATE_CHANNEL_ID);
		var update = client.commands.get("writeupdate").getUpdateContent();
		var now = new Date();
		if(update != false) {
			Logger.logInfo("Sending daily update for " + (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear() + "!");
			channel.send({embeds: [update]});
		} else {
			Logger.logInfo("No new RideEvents on " + (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear() + ", update not sent.");
		}
	});
	console.log(`\x1b[1;32mReady!\x1b[0m Logged in as ${c.user.tag}`);
	Logger.logDebug("Verbose mode enabled!");
});

/* Handle button interactions */
client.on(Events.InteractionCreate, async function(interaction) {
	if (!(interaction.isButton() || interaction.isModalSubmit())) return;
	Logger.logDebug("Recieved button interaction of type " + interaction.customId);
	// --- Hande Create Buttons ---
	if(interaction.customId == 'newOffer'){
		client.commands.get("offer").execute(interaction);
		return;
	} else if(interaction.customId == 'newRequest'){
		RideCommandBuilder.genLink(interaction, "request", false);
		return;
	} else if(interaction.customId == 'newUrgentRequest'){
		RideCommandBuilder.genLink(interaction, "request", true);
		return;
	}
	const panelID = interaction.message.id;
	Logger.logDebug(panelID);
	//Rides are stored under their respective panel ID, so load the correct ride
	var rdEvt;
	try {
		rdEvt = await RideEvent.getRideByPanelId(panelID);
	} catch (e) {
		Logger.logDebug("Ride not found!");
		Logger.logDebug(e);
		interaction.reply({content: "ERROR: RideEvent not found! Please contact @ScanuRag#2531"});
		return;
	}
	Logger.logDebug(rdEvt);
	if(interaction.customId == 'cancelReq' || interaction.customId == 'cancelOff') { //The user clicked a cancel button
		if(rdEvt.deleted !== true){
			rdEvt.cancel(client, interaction);
		} else {
			interaction.reply({content: 'ERROR: RideEvent has already been cancelled', ephemeral: true});
		}
	} else if (interaction.customId == "foundRide"){
		if(rdEvt.deleted !== true){
			await rdEvt.appendStatus(client, `Good News!  ${rdEvt.target.username} found a ride.`, true);
			interaction.reply({content: 'Awesome news! I\'m thrilled that I was able to help you get to your destination.', ephemeral: true});
		} else {
			interaction.reply({content: 'ERROR: Request has already been cancelled', ephemeral: true});
		}
	} else if(interaction.customId == 'setStatus') {
		const modal = new ModalBuilder()
			.setCustomId('statusModal')
			.setTitle('Set Status');

		const statusInput = new TextInputBuilder()
			.setCustomId('statusInput')
		    // The label is the prompt the user sees for this input
			.setLabel("Status")
		    // Short means only a single line of text
			.setStyle(TextInputStyle.Short);

		const ar = new ActionRowBuilder().addComponents(statusInput);

		// Add inputs to the modal
		modal.addComponents(ar);

		interaction.showModal(modal);
	} else if(interaction.customId == 'statusModal') {
		if(rdEvt.deleted !== true){
			await rdEvt.appendStatus(client, interaction.fields.getTextInputValue('statusInput'), false);
			interaction.reply({content: 'Status updated', ephemeral: true});
			Logger.logDebug("Status saved for ride with id " + rdEvt.rideid);
		} else {
			interaction.reply({content: 'ERROR: Cannot update status of cancelled request', ephemeral: true});
		}
	} else if(interaction.customId = 'editRide') {
		//console.log(rdEvtData);
		const state = await RideCommandBuilder.genState(interaction);
		interaction.reply({content: `Click here to edit your Ride: ${constants.HOSTNAME}viewRides.html?rideId=${rdEvt.rideid}&state=${state}`, ephemeral: true});
	}
	/*Request.saveEvents(requests);
	Offer.saveEvents(offers);*/
});

// Log in to Discord with your client's token
client.login(process.env.TOKEN);
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
					api.getLoginInfo(client, bodyJSON, res);
				} else if(req.url == "/api/getRidesByUser") {
					api.getRidesByUser(bodyJSON, res);
				} else if(req.url == "/api/viewSingleRide") {
					api.viewSingleRide(bodyJSON, res);
				} else if(req.url == "/api/editRides") {
					api.editRides(client, bodyJSON, res);
				} else if(req.url == "/api/submitRideEvent") {
					api.submitRideEvent(client, bodyJSON, res);
				} else if (req.url == "/api/userInServer") {
					api.userInServer(client, bodyJSON, res);
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
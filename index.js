// Require the necessary discord.js classes
const { Client, Collection, Events, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
var LocalStorage = require('node-localstorage').LocalStorage;
var schedule = require('node-schedule');
localStorage = new LocalStorage('./ridedata');
const constants = require("./constants.js");

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
	j = schedule.scheduleJob({hour: 20, minute: 0}, async function() {
		var channel = await client.channels.fetch(constants.UPDATE_CHANNEL_ID);
		var update = client.commands.get("writeupdate").getUpdateContent();
		if(update != false) {
			//console.log("Sending daily update!");
			channel.send({embeds: [update]});
		} else {
			//console.log("No new ride requests!");
		}
	});
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

/* Handle button interactions */
client.on(Events.InteractionCreate, async function(interaction) {
	if (!(interaction.isButton() || interaction.isModalSubmit())) return;
	var requests = JSON.parse(localStorage.getItem('requests')) ?? [];
	var offers = JSON.parse(localStorage.getItem('rides')) ?? [];
	const panelID = interaction.message.id;
	var rdEvt = requests[panelID] ?? offers[panelID];
	if(interaction.customId == 'cancelReq') { //The user clicked a cancel button
		if(rdEvt.deleted !== true){
			rdEvt.deleted = true;
			await replaceWithStatus(rdEvt, `**${rdEvt.user.username}** has cancelled their request for a ride to \`${rdEvt.dest}\`.`);
			interaction.reply({content: 'Request cancelled. Please be sure to inform anyone who offered you a ride!', ephemeral: true});
		} else {
			interaction.reply({content: 'ERROR: Request has already been cancelled', ephemeral: true});
		}
	} else if (interaction.customId == "foundRide"){
		if(rdEvt.deleted !== true){
			rdEvt.deleted = true;
			await appendStatus(rdEvt, `**Good News!** ${rdEvt.user.username} found a ride.`, true);
			interaction.reply({content: 'Awesome news! I\'m thrilled that I was able to help you get to your destination.', ephemeral: true});
		} else {
			interaction.reply({content: 'ERROR: Request has already been cancelled', ephemeral: true});
		}
	} else if(interaction.customId == 'cancelOff') { //The user clicked a cancel button
		if(rdEvt.deleted !== true){
			rdEvt.deleted = true;
			await replaceWithStatus(rdEvt, `**${rdEvt.user.username}** has cancelled their ride offer to \`${rdEvt.dest}\`.`);
			interaction.reply({content: 'Ride offer cancelled. Please be sure to inform anyone who was planning to ride with you!', ephemeral: true});
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
			await appendStatus(rdEvt, interaction.fields.getTextInputValue('statusInput'), false);
			interaction.reply({content: 'Status updated', ephemeral: true});
		} else {
			interaction.reply({content: 'ERROR: Cannot update status of cancelled request', ephemeral: true});
		}
	}
	localStorage.setItem('rides', JSON.stringify(offers));
	localStorage.setItem('requests', JSON.stringify(requests));
});

async function replaceWithStatus(rideEvent, status) {
	const message = await getMessageFromRideEvent(rideEvent);
	message.edit(status);
}

async function appendStatus(rideEvent, status, strikethrough) {
	const message = await getMessageFromRideEvent(rideEvent);
	var strkString = strikethrough ? "~~" : "";
	message.edit(`${strkString}${rideEvent.message.content}${strkString}\n\n**Status:**\n> ${status}`);
}

async function getMessageFromRideEvent(re) {
	const channel = client.channels.cache.get(re.message.channelId);
	const message = await channel.messages.fetch(re.message.id);
	return message;
}

// Log in to Discord with your client's token
client.login(token);

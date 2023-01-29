const { Client, Collection, Events, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { token } = require('./config.json');
const Logger = require("./logger.js");
const constants = require("./constants.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, c => {
	Logger.writeBanner();
	console.log(`\x1b[1;32mReady!\x1b[0m Logged in as ${c.user.tag}`);
	Logger.logDebug("Verbose mode enabled!");
    Logger.logInfo("Trying to deploy new ride buttons!");
    client.channels.fetch(constants.BUTTONS_CHANNEL_ID).then(function (channel){
        Logger.logInfo("Fetched buttons channel");
        const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('newOffer')
					.setLabel('Create Ride Offer')
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId('newRequest')
					.setLabel('Create Ride Request')
					.setStyle(ButtonStyle.Primary),
			);
        channel.send({content: "Use the buttons to create a new Offer or Request: \n", components: [row]});
    });
});

client.login(token);

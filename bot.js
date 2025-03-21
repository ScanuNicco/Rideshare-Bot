const { Client, Collection, Events, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('node:path');
const fs = require('node:fs');
const Logger = require("./logger.js");
var schedule = require('node-schedule');
const { RideCommandBuilder, Offer, Request, RideEvent } = require("./rideEventBuilder.js");



class RideshareBot {
    constructor(token) {
        // Create a new client instance
        this.client = new Client({ intents: [GatewayIntentBits.Guilds] });

        this.client.commands = new Collection();

        var commandsPath = path.join(__dirname, 'commands');
        var commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            var filePath = path.join(commandsPath, file);
            var command = require(filePath);
            // Set a new item in the Collection with the key as the command name and the value as the exported module
            if ('data' in command && 'execute' in command) {
                this.client.commands.set(command.data.name, command);
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }

        this.client.on(Events.InteractionCreate, async interaction => {
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
        this.client.once(Events.ClientReady, c => {
            Logger.writeBanner();
            j = schedule.scheduleJob({hour: 20, minute: 0}, async function() {
                var channel = await this.client.channels.fetch(constants.UPDATE_CHANNEL_ID);
                var update = this.client.commands.get("writeupdate").getUpdateContent();
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
        this.client.on(Events.InteractionCreate, async function(interaction) {
            if (!(interaction.isButton() || interaction.isModalSubmit())) return;
            Logger.logDebug("Recieved button interaction of type " + interaction.customId);
            // --- Hande Create Buttons ---
            if(interaction.customId == 'newOffer'){
                this.client.commands.get("offer").execute(interaction);
                return;
            } else if(interaction.customId == 'newRequest'){
                RideCommandBuilder.genLink(interaction, "request", false);
                return;
            } else if(interaction.customId == 'newUrgentRequest'){
                RideCommandBuilder.genLink(interaction, "request", true);
                return;
            }
            var panelID = interaction.message.id;
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
                    await rdEvt.appendStatus(this, interaction.fields.getTextInputValue('statusInput'), false);
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
        this.client.login(token);
    }

    async fetchUserInfo (id) {
        return await this.client.users.fetch(id);
    }

    async sendMessageInChannel(channelID, messageText) {
        var channel = await this.client.channels.fetch(channelID);
        return await channel.send(messageText, {"allowedMentions": { "users" : []}});
    }

    async getMessage(messageID, channelID) {
        const channel = this.client.channels.cache.get(messageID);
        const message = await channel.messages.fetch(channelID);
        return message;
    }

    async editMessage(messageID, channelID, newContent) {
        this.getMessage(messageID, channelID).edit(newContent);
    }

    async sendOfferControls(userID, title) {
        const userObj = await fetchUserInfo(userID);
        const userDM = await userObj.createDM();
		const row = new ActionRowBuilder()
			.addComponents(
                new ButtonBuilder()
					.setCustomId('editRide')
					.setLabel('Edit Offer')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('setStatus')
					.setLabel('Set Status')
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId('cancelOff')
					.setLabel('Cancel this Offer')
					.setStyle(ButtonStyle.Danger),
			);
		const controls = await userDM.send({content: title, components: [row]});
        return controls.id;
    }

    async sendRequestControls(userID, title) {
        const userObj = await this.fetchUserInfo(userID);
        const userDM = await userObj.createDM();
		const row = new ActionRowBuilder()
			.addComponents(
                new ButtonBuilder()
                    .setCustomId('editRide')
                    .setLabel('Edit Request')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('setStatus')
                    .setLabel('Set Status')
                    .setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId('foundRide')
					.setLabel('I Found a Ride!')
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId('cancelReq')
					.setLabel('Cancel this Request')
					.setStyle(ButtonStyle.Danger),
			);
		const controls = await userDM.send({content: title, components: [row]});
        return controls.id;
    }

    async sendUrgentRequest(title, message, info) {
		const update = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(title)
			.addFields({name: "Details:", value: message}, {name: "Additional Info:", value: (info ?? "None")});
		var channel = await this.client.channels.fetch(constants.UPDATE_CHANNEL_ID);
		channel.send({content: "<@&1027782166811254805>", embeds: [update]});
    }

    async isUserInServer(userID) {
        //Now that we have the user ID, we can go back to calling the regular bot API. 
        const guild = await this.client.guilds.fetch(process.env.GUILD_ID);
        try{
            const guildUserData = await guild.members.fetch(userID);
            console.log(guildUserData);
        } catch (e) {
            if(e.rawError.code == 10007) {
                return 1;
            } else {
                Logger.logError(e);
                return 2;
            }
        }
        return 0;
    }
}

module.exports = {
    RideshareBot
}
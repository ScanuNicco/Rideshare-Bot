const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, hyperlink } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const constants = require("./constants.js");
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./ridedata');

class RideCommandBuilder extends SlashCommandBuilder {

    constructor(name, description) {
        super()
            .setName(name)
            .setDescription(description);
        this.name = name;
    }

    static genLink(interaction, type) {
        var states = JSON.parse(localStorage.getItem('states')) ?? {};
		var uuid = uuidv4();
        try {
            var urgent = interaction.options.getBoolean("urgent");
        } catch {
            var urgent = false;
        }
		states[uuid] = {user: interaction.user, urgent: urgent};
		interaction.reply({content: `Here's your personal url:\n${constants.HOSTNAME}rideform.html?type=${type}&state=${uuid}`, ephemeral: true});
		localStorage.setItem('states', JSON.stringify(states));
    }
}

class RideEvent {
    constructor(obj) {
        //The static methods handle object creation because JavaScript can't do constructor overloading
        this.timestamp = obj.timestamp;
        this.deleted = obj.deleted;
        this.target = obj.target;
        this.dest = obj.dest;
        this.whence = obj.whence;
        this.when = obj.when;
        this.payment = obj.payment;
        this.info = obj.info;
        this.message = obj.message; //This is a Data Object, not the actual Message object that has functions and stuff. Use getMessageFromRideEvent() for that.
        this.whencestring = this.whence != '' ? `from ${this.whence} ` : '';
        this.cat = obj.cat;
        this.status = obj.status ?? "No Status";
    }

    writeMessageText() {
        return "Placeholder RideEvent message.";
    }

    writeUpdateText() {

    }

    async getMessageFromRideEvent(client) {
        const channel = client.channels.cache.get(this.message.channelId);
        const message = await channel.messages.fetch(this.message.id);
        return message;
    }

    async replaceWithStatus(client, status) {
        const message = await this.getMessageFromRideEvent(client);
        message.edit(status);
    }

    async appendStatus(client, status, strikethrough) {
        const message = await this.getMessageFromRideEvent(client);
        var strkString = strikethrough ? "~~" : "";
        message.edit(`${strkString}${this.message.content}${strkString}\n\n**Status:**\n> ${status}`);
        this.status = status;
    }

    async cancel(client, interaction) {
        this.deleted = true;
    }

    async sendRideMessage(client, channelID) {
        var channel = await client.channels.fetch(channelID);
        this.message = await channel.send(this.writeMessageText());
    }

    getTimeString() { //Returns the time as a sting in EASTERN TIME
        return new Date(this.when).toLocaleString('en-US', { timeZone: 'America/New_York' });
    }

    async sendControls() {
        //Do nothing. This method is to be inherited
    }

    static loadEvents() {
        //Do nothing. This method is to be inherited
    }

    genRideLink() {
        return hyperlink("More Info", `https://discord.com/channels/${this.message.guildId}/${this.message.channelId}/${this.message.id}`, "here");
    }
}

class Offer extends RideEvent {
    constructor(obj) {
        super(obj);
        this.vehicleInfo = obj.vehicleInfo;
    }

    writeMessageText() {
        const message = `**${this.target.username}** is offering a ride ${this.whencestring}to \`${this.dest}\` on \`${this.getTimeString()}\`.${(this.payment ? " They are requesting that you help cover the cost of parking/gas. " : "")}\n\nVehicle Info:\n${this.vehicleInfo}\n\n*Additional Info:*\n${(this.info ?? "None")}`;
        return message;
    }

    writeUpdateText() {
        const update = this.target.username + " is offering a ride " + this.whencestring + "to `" + this.dest + "` on `" + this.getTimeString() + "`. " + this.genRideLink() + "\n";
        return update;
    }

    async cancel(client, interaction) {
        super.cancel(interaction);
        await this.replaceWithStatus(client, `**${this.target.username}** has cancelled their ride offer to \`${this.dest}\`.`);
        interaction.reply({content: 'Ride offer cancelled. Please be sure to inform anyone who was planning to ride with you!', ephemeral: true});
    }

    async sendControls(client) {
        const userObj = await client.users.fetch(this.target.id);
        const userDM = await userObj.createDM();
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('setStatus')
					.setLabel('Set Status')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('cancelOff')
					.setLabel('Cancel this Offer')
					.setStyle(ButtonStyle.Danger),
			);
		const controls = await userDM.send({content: "**Handy Control Panel:** Ride offer for `" + this.dest + "`", components: [row]});
        return controls.id;
    }

    static loadEvents() {
        return JSON.parse(localStorage.getItem('rides')) ?? [];
    }

    static saveEvents(arr) {
        localStorage.setItem('rides', JSON.stringify(arr));
    }
}

class Request extends RideEvent {
    writeMessageText() {
        const message = `**${this.target.username}** is looking for a ride ${this.whencestring}to \`${this.dest}\` on \`${this.getTimeString()}\`.${(this.payment ? " They are offering to help cover the cost of parking/gas. " : "")}\n\n*Additional Info:*\n${(this.info ?? "None")}`;
        return message;
    }

    writeUpdateText() {
        const update = this.target.username + " is looking for a ride " + this.whencestring + "to `" + this.dest + "` on `" + this.getTimeString() + "`. " + this.genRideLink() + "\n";
        return update;
    }

    async cancel(client, interaction) {
        super.cancel(interaction);
        await this.replaceWithStatus(client, `**${this.target.username}** has cancelled their request for a ride to \`${this.dest}\`.`);
        interaction.reply({content: 'Request cancelled. Please be sure to inform anyone who offered you a ride!', ephemeral: true});
    }

    async sendControls(client) {
        const userObj = await client.users.fetch(this.target.id);
        const userDM = await userObj.createDM();
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('foundRide')
					.setLabel('I Found a Ride!')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('cancelReq')
					.setLabel('Cancel this Request')
					.setStyle(ButtonStyle.Danger),
			);
		const controls = await userDM.send({content: "**Handy Control Panel:** Ride request for `" + this.dest + "`", components: [row]});
        return controls.id;
    }

    static loadEvents() {
        return JSON.parse(localStorage.getItem('requests')) ?? [];
    }

    static saveEvents(arr) {
        localStorage.setItem('requests', JSON.stringify(arr));
    }
}

module.exports.RideCommandBuilder = RideCommandBuilder;
module.exports.Request = Request;
module.exports.Offer = Offer;

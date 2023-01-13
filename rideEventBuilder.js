const { SlashCommandBuilder } = require('discord.js');

class RideCommandBuilder extends SlashCommandBuilder {

    constructor(name, description) {
        super()
            .setName('offer')
            .setDescription('Offer a ride')
            .addStringOption(option =>
                option.setName('where')
                    .setDescription('Where are you going? Keep this under 5 words.')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('when')
                    .setDescription('When are you going? Be sure to include the numerical date. "Thursday" is not specific enough.')
                    .setRequired(true))
        this.name = name;
    }

    addDefaultOptionals() {
        this
            .addStringOption(option =>
                option.setName('whence')
                    .setDescription('Where are you leaving from? Keep this under 5 words.'))
            .addBooleanOption(option =>
                option.setName('payment')
                    .setDescription(`Are you ${this.name == 'offer' ? 'expecting' : 'offering'} payment to help cover the cost of gas/parking?`))
            .addStringOption(option =>
                option.setName('additional-info')
                    .setDescription('Anything else you want to add.'))
            .addUserOption(option =>
                option.setName('user')
                    .setDescription(`Create this ${this.name} for another user. Do not abuse this option or it will be removed.`));
        return this;
    }
}

class RideEvent {
    constructor() {
        //The static methods handle object creation because JavaScript can't do constructor overloading
        this.timestamp = Date.now();
        this.deleted = false;
    }

    async fromInteraction(interaction) {
        var re = new RideEvent();
        this.target = interaction.options.getUser('user') ?? interaction.user;
		this.dest = interaction.options.getString('where');
		this.whence = interaction.options.getString('whence');
		this.whencestring = "";
		if(this.whence != null && this.whence != undefined){
			this.whencestring = "from `" + this.whence + "` ";
		}
		this.when = interaction.options.getString('when');
		this.payment = interaction.options.getBoolean('payment');
		this.info = interaction.options.getString("additional-info");
    }

    fromDataObject(obj) {
        var re = new RideEvent();
        this.target = obj.target;
        this.dest = obj.dest;
        this.whence = obj.whence;
        this.whencestring = obj.whencestring;
        this.when = obj.when;
        this.payment = obj.payment;
        this.info = obj.info;
        this.message = obj.message; //This is a Data Object, not the actual Message object that has functions and stuff. Use getMessageFromRideEvent() for that.
    }

    writeMessageText() {
        return "Placeholder RideEvent message.";
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
    }

    async cancel(client, interaction) {
        this.deleted = true;
    }
}

class Offer extends RideEvent {
    async fromInteraction(interaction) {
        await super.fromInteraction(interaction);
        this.vehicleInfo = interaction.options.getString("vehicle-description");
        this.message = await interaction.channel.send(this.writeMessageText());
    }

    fromDataObject(obj) {
        super.fromDataObject(obj);
        this.vehicleInfo = obj.vehicleInfo;
    }

    writeMessageText() {
        const message = `**${this.target.username}** is offering a ride ${this.whencestring}to \`${this.dest}\` on \`${this.when}\`.${(this.payment ? "He/she is requesting that you help cover the cost of parking/gas. " : "")}\n\nVehicle Info:\n${this.vehicleInfo}\n\n*Additional Info:*\n${(this.info ?? "None")}`;
        return message;
    }

    async cancel(client, interaction) {
        super.cancel(interaction);
        await this.replaceWithStatus(client, `**${this.target.username}** has cancelled their ride offer to \`${this.dest}\`.`);
        interaction.reply({content: 'Ride offer cancelled. Please be sure to inform anyone who was planning to ride with you!', ephemeral: true});
    }
}

class Request extends RideEvent {
    async fromInteraction(interaction) {
        await super.fromInteraction(interaction);
        this.message = await interaction.channel.send(this.writeMessageText());
    }

    writeMessageText() {
        const message = `**${this.target.username}** is looking for a ride ${this.whencestring}to \`${this.dest}\` on \`${this.when}\`.${(this.payment ? "He/she is offering to help cover the cost of parking/gas. " : "")}\n\n*Additional Info:*\n${(this.info ?? "None")}`;
        return message;
    }

    async cancel(client, interaction) {
        super.cancel(interaction);
        await this.replaceWithStatus(client, `**${this.target.username}** has cancelled their request for a ride to \`${this.dest}\`.`);
        interaction.reply({content: 'Request cancelled. Please be sure to inform anyone who offered you a ride!', ephemeral: true});
    }
}

module.exports.RideCommandBuilder = RideCommandBuilder;
module.exports.Request = Request;
module.exports.Offer = Offer;

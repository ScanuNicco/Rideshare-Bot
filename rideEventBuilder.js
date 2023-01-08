const { SlashCommandBuilder } = require('discord.js');
/*
exports.buildBaseRideEvent = function(name, description){
    const command = new SlashCommandBuilder()
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
		.addStringOption(option =>
			option.setName('whence')
				.setDescription('Where are you leaving from? Keep this under 5 words.'))
		.addBooleanOption(option =>
			option.setName('payment')
				.setDescription(`Are you ${name == 'offer' ? 'expecting' : 'offering'} payment to help cover the cost of gas/parking?`))
		.addStringOption(option =>
			option.setName('additional-info')
				.setDescription('Anything else you want to add.'))
		.addUserOption(option =>
			option.setName('user')
				.setDescription(`Create this ${name} on behalf of another user. Please do not abuse this or it will be removed.`));
        return command;
}*/


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
    }

    writeMessageText() {
        return "Placeholder RideEvent message.";
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
}

module.exports.RideCommandBuilder = RideCommandBuilder;
module.exports.Request = Request;
module.exports.Offer = Offer;

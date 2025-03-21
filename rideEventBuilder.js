const { SlashCommandBuilder, hyperlink } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const constants = require("./constants.js");
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./ridedata');
const sanitizeHtml = require('sanitize-html');
const Logger = require("./logger.js");
const pg = require('./connectPostgres.js');
require('dotenv').config();

function clean(dirty) {
    return sanitizeHtml(dirty, {
        allowedTags: [],
        allowedAttributes: {}
    });
}

class RideCommandBuilder extends SlashCommandBuilder {

    constructor(name, description) {
        super()
            .setName(name)
            .setDescription(description);
        this.name = name;
    }

    static async genLink(interaction, type, urgent=false) {
        const pgClient = pg.getNewClient();
        await pgClient.connect();
        var createUpdateQuery = 'CALL upsertUser($1, $2, $3, $4)';
        console.log(interaction.user);
        await pgClient.query(createUpdateQuery, [interaction.user.id, interaction.user.globalName, interaction.user.username, interaction.user.avatarURL()]);
        //Now that the user exists, let's make a state for them
        var validateQuery = `SELECT createState(${interaction.user.id})`;
        try {
            const pgResponse = await pgClient.query(validateQuery);
            var state = pgResponse.rows[0];
            interaction.reply({content: `Here's your personal url:\n${constants.HOSTNAME}rideform.html?type=${type}${urgent ? "&urgent=true" : ""}&state=${state.createstate}`, ephemeral: true});
        } catch (e) {
            interaction.reply({content: `SQL error while creating state`, ephemeral: true});
        }
        await pgClient.end();
    }

    static async genState(interaction) {
        const pgClient = pg.getNewClient();
        await pgClient.connect();
        var createUpdateQuery = 'CALL upsertUser($1, $2, $3, $4)';
        console.log(interaction.user);
        await pgClient.query(createUpdateQuery, [interaction.user.id, interaction.user.globalName, interaction.user.username, interaction.user.avatarURL()]);
        //Now that the user exists, let's make a state for them
        var validateQuery = `SELECT createState(${interaction.user.id})`;
        var state;
        try {
            const pgResponse = await pgClient.query(validateQuery);
            var state = pgResponse.rows[0].createstate;
        } catch (e) {
            state = false;
        }
        await pgClient.end();
        return state;
    }
}

class RideEvent {
    constructor(obj) {
        //This class should not be instantiated.
        this.timestamp = obj.timestamp;
        this.deleted = obj.deleted;
        this.target = obj.target;
        this.dest = obj.dest;
        this.whence = obj.whence;
        this.when = obj.when;
        this.payment = obj.payment;
        this.info = clean(obj.info);
        this.channelID = obj.channelID;
        this.messageID = obj.messageID; //This is a Data Object, not the actual Message object that has functions and stuff. Use getMessageFromRideEvent() for that.
        this.destName = this.dest.name;
        this.destDetails = this.dest.display_name;
        this.whenceName = this.whence.name;
        this.whenceDetails = this.whence.display_name;
        this.cat = obj.cat;
        this.status = obj.status ?? "No Status";
        this.rideid = obj.rideid;
    }

    static async getRideByPanelId(id) {
        var pgClient = pg.getNewClient();
        await pgClient.connect();
        var q = 'SELECT * from getridebypanelid($1)';
        const pgResponse = await pgClient.query(q, [id]);
        var res =  pgResponse.rows[0];
        pgClient.end();
        Logger.logDebug(res);
        //Put data in dest and whence objects for compatibility
        return this.parsePGFullRide(res);
    }

    static async getRideById(id) {
        var pgClient = pg.getNewClient();
        await pgClient.connect();
        var q = 'SELECT * from getridebyid($1)';
        const pgResponse = await pgClient.query(q, [id]);
        var res =  pgResponse.rows[0];
        pgClient.end();
        Logger.logDebug(res);
        //Put data in dest and whence objects for compatibility
        return this.parsePGFullRide(res);
    }


    static async parsePGFullRide(res) {
        //Put data in dest and whence objects for compatibility
        res.dest = {lat: res.dlat, lon: res.dlong, name: res.dlname, display_name: res.dllabel, type: res.dltype};
        res.whence = {lat: res.olat, lon: res.olong, name: res.olname, display_name: res.ollabel, type: res.oltype};
        res.message = {id: res.dmessageid, guildId: res.dguildid, channelId: res.dchannelid};
        res.target = {id: res.duserid, username: res.username, displayname: res.displayname, avatarurl: res.avatarurl};
        return res.isOffer ? new Offer(res) : new Request(res);
    }

    writeMessageText() {
        return "Placeholder RideEvent message.";
    }

    async getMessageFromRideEvent(bot) {
        bot.getMessage(this.messageID, this.channelID); //this.message.channelId, this.message.id
    }

    async replaceWithStatus(bot, status) {
        bot.editMessage(this.messageID, this.channelID)
        this.status = status;
        this.saveStatus();
    }

    async appendStatus(bot, status, strikethrough) {
        this.status = status;
        this.updateRideMessage(bot)
        this.saveStatus();
    }

    async saveStatus() {
        this.deleted = true;
        var pgClient = pg.getNewClient();
        await pgClient.connect();
        var q = 'CALL setStatus($1, $2)';
        await pgClient.query(q, [this.rideid, this.status]);
        pgClient.end();
    }

    async cancel(bot, interaction) {
        this.deleted = true;
        var pgClient = pg.getNewClient();
        await pgClient.connect();
        var q = 'CALL cancelRide($1)';
        await pgClient.query(q, [this.rideid]);
        pgClient.end();
    }

    async sendRideMessage(bot, channelID) {
        Logger.logDebug("Sending ride message in channel: " + channelID);
        return bot.sendMessageInChannel(channelID, this.writeMessageText());
    }

    async updateRideMessage(bot) {
        bot.editMessage(this.messageID, this.channelID, this.writeMessageText());
    }

    static getTimeString(departureTime) { //Returns the time as a sting in EASTERN TIME
        return new Date(departureTime).toLocaleString('en-US', { timeZone: 'America/New_York' });
    }

    async sendControls() {
        //Do nothing. This method is to be inherited
    }

    static loadEvents() {
        //Do nothing. This method is to be inherited
    }

    static genRideLink(messageId, channelId, guildId) {
        return hyperlink("More Info", `https://discord.com/channels/${guildId}/${channelId}/${messageId}`, "here");
    }
}

class Offer extends RideEvent {
    constructor(obj) {
        super(obj);
        this.vehicleInfo = clean(obj.vehicleInfo);
    }

    writeMessageText() {
        const message = `<@${this.target.id}> is offering a ride from ${this.whenceName} to \`${this.destName}\` on \`${RideEvent.getTimeString(this.when)}\`.${(this.payment ? " They are requesting that you help cover the cost of parking/gas. " : "")}\n\nOrigin:\n${this.whenceDetails}\n\nDestination:\n${this.destDetails}\n\nVehicle Info:\n${this.vehicleInfo}\n\n*Additional Info:*\n${(this.info ?? "None")}\n\n**Status:**\n> ${this.status ?? 'No Status'}`;
        return message;
    }

    async cancel(bot, interaction) {
        await super.cancel(interaction);
        await this.replaceWithStatus(bot, `**${this.target.username}** has cancelled their ride offer to \`${this.destName}\`.`);
        interaction.reply({content: 'Ride offer cancelled. Please be sure to inform anyone who was planning to ride with you!', ephemeral: true});
    }

    async sendControls(bot) {
        return await bot.sendOfferControls(this.target.id, "**Handy Control Panel:** Ride offer for `" + this.destName + "`");
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
        const message = `<@${this.target.id}> is looking for a ride from ${this.whenceName} to \`${this.destName}\` on \`${RideEvent.getTimeString(this.when)}\`.${(this.payment ? " They are offering to help cover the cost of parking/gas. " : "")}\n\nOrigin:\n${this.whenceDetails}\n\nDestination:\n${this.destDetails}\n\n*Additional Info:*\n${(this.info ?? "None")}\n\n**Status:**\n> ${this.status ?? 'No Status'}`;
        return message;
    }

    async cancel(bot, interaction) {
        await super.cancel(interaction);
        await this.replaceWithStatus(bot, `**${this.target.username}** has cancelled their request for a ride to \`${this.destName}\`.`);
        interaction.reply({content: 'Request cancelled. Please be sure to inform anyone who offered you a ride!', ephemeral: true});
    }

    async sendControls(bot) {
        return await bot.sendRequestControls(this.target.id, "**Handy Control Panel:** Ride request for `" + this.destName + "`");
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
module.exports.RideEvent = RideEvent;
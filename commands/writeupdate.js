const { SlashCommandBuilder, EmbedBuilder, hyperlink } = require('discord.js');
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./ridedata');
const Logger = require('../logger.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('writeupdate')
		.setDescription('Write the daily update'),
	async execute(interaction) {
        var update = writeUpdate();
        if(writeUpdate() != false) {
            interaction.channel.send({embeds: [writeUpdate()]});
        } else {
            await interaction.reply({content: "No one posted any rides today, so no update will be sent.", ephemeral: true});
        }
	}, getUpdateContent() {
        return writeUpdate();
    },
};

function writeUpdate() {
	Logger.logDebug("Daily Update Started:");
    var now = new Date();
    const update = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle("Daily Update " + (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear())
        .setFooter({text: "Daily updates are always sent at 11:00pm"});
	var rides = JSON.parse(localStorage.getItem('rides')) ?? [];
    var requests = JSON.parse(localStorage.getItem('requests')) ?? [];
    Logger.logDebug("	Offers: " + Object.keys(rides).length);
    Logger.logDebug("	Requests: " + Object.keys(requests).length);
	const HOURS_24 = 24*60*60*1000; //Note: Javascript timestamps are in **Milliseconds**
	Logger.logDebug(`	Looking for RideEvents within ${HOURS_24} of ${now.getTime()}`)
	var ridesText = "";
	for(const key in rides){
		ride = rides[key];
        Logger.logDebug(`	Ride offer from ${ride.target.username}: ${now.getTime()} - ${ride.timestamp} = ${(now.getTime() - ride.timestamp)}`);
		if(now.getTime() - ride.timestamp < HOURS_24 && ride.deleted !== true) {
			Logger.logDebug("		RideEvent will be posted in the update!");
			ridesText += ride.target.username + " is offering a ride " + ride.whencestring + "to `" + ride.dest + "` on `" + ride.when + "`. " + hyperlink("More Info", `https://discord.com/channels/${ride.message.guildId}/${ride.message.channelId}/${ride.message.id}`, "here") + "\n";
		}
	}
	if(ridesText != "") {
        update.addFields({name: "Offering Rides:", value: ridesText});
    }
	var requestsText = "";
	for(const key in requests){
		ride = requests[key];
		Logger.logDebug(`	Ride request from ${ride.target.username}: ${now.getTime()} - ${ride.timestamp} = ${(now.getTime() - ride.timestamp)}`);
		if(now.getTime() - ride.timestamp < HOURS_24 && ride.deleted !== true) {
			Logger.logDebug("		RideEvent will be posted in the update!");
			requestsText += ride.target.username + " is looking for a ride " + ride.whencestring + "to `" + ride.dest + "` on `" + ride.when + "`. " + hyperlink("More Info", `https://discord.com/channels/${ride.message.guildId}/${ride.message.channelId}/${ride.message.id}`, "here") + "\n";
		}
	}
    if(requestsText != "") {
        update.addFields({name: "Requesting Rides:", value: requestsText});
    }
	if((ridesText == "" && requestsText == "")){
		Logger.logDebug("	No RideEvents in timeframe. Update will not be sent!")
		return false; //If there were no new rides today, return false
	} else {
		Logger.logDebug("	Update will be sent!")
		return update;
	}
}

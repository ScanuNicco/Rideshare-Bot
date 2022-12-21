const { SlashCommandBuilder, EmbedBuilder, hyperlink } = require('discord.js');
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./ridedata');

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
    var now = new Date();
    const update = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle("Daily Update " + (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear())
        .setFooter({text: "Daily updates are always sent at 11:00pm"});
	var rides = JSON.parse(localStorage.getItem('rides')) ?? [];
    var requests = JSON.parse(localStorage.getItem('requests')) ?? [];
    //console.log(rides);
    //console.log(requests);
	const HOURS_24 = 24*60*60*1000;
	var ridesText = "";
	for(var i = 0; i < rides.length; i++){
		ride = rides[i];
        //console.log("Time passed: " + (now.getTime() - ride.timestamp));
		if(now.getTime() - ride.timestamp < HOURS_24) {
			ridesText += ride.user.username + " is offering a ride " + ride.whencestring + "to `" + ride.dest + "` on `" + ride.when + "`. " + hyperlink("More Info", `https://discord.com/channels/${ride.message.guildId}/${ride.message.channelId}/${ride.message.id}`, "here") + "\n";
		}
	}
	if(ridesText != "") {
        update.addFields({name: "Offering Rides:", value: ridesText});
    }
	var requestsText = "";
	for(var i = 0; i < requests.length; i++){
		ride = requests[i];
        //console.log("Time passed: " + (now.getTime() - ride.timestamp));
		if(now.getTime() - ride.timestamp < HOURS_24) {
			requestsText += ride.user.username + " is looking for a ride " + ride.whencestring + "to `" + ride.dest + "` on `" + ride.when + "`. " + hyperlink("More Info", `https://discord.com/channels/${ride.message.guildId}/${ride.message.channelId}/${ride.message.id}`, "here") + "\n";
		}
	}
    if(requestsText != "") {
        update.addFields({name: "Requesting Rides:", value: requestsText});
    }
	if((ridesText == "" && requestsText == "")){
		return false; //If there were no new rides today, return false
	} else {
		return update;
	}
}

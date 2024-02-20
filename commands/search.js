const { SlashCommandBuilder, EmbedBuilder, hyperlink } = require('discord.js');
const constants = require('../constants.js');
const { Offer, Request } = require('../rideEventBuilder.js');
const pg = require('../connectPostgres.js');
const Logger = require("../logger.js");

module.exports = {
	data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for an Offer or Request')
        .addStringOption(option =>
			option
				.setName('query')
				.setDescription('Where do you want to go?')
                .setRequired(true)),

	async execute(interaction) {
        const query = interaction.options.getString("query");
        var result = await getResults(query);
        //find a way to parse DB output as string
        if(result != false) {
			//await interaction.reply(`**${interaction.user.username}** requested a search:`);
            await interaction.reply({embeds: [result]});
        } else {
            await interaction.reply({content: "   No Results. Try posting an Offer or Request"});
        }		
	},
};

async function getResults(q) {
    Logger.logDebug("Search started:");
	var pgClient = pg.getNewClient();
    await pgClient.connect();

    var updateQuery = `SELECT * FROM searchrides('d', '${q}')`;
	const pgResponse = await pgClient.query(updateQuery);
    var allRides =  pgResponse.rows;

    const result = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Search results: ${q}`);

    var ridesText = "";
    var count = 0;
    for(const ride of allRides){
        //ride = new Offer(rides[key]);
        if(count == 3){
            break;
        }
        Logger.logDebug(ride);
        //only searches for offers is implemented

        //if(ride.isoffer) {
             ridesText += `${ride.displayname} is offering a ride from ${ride.olname} to ${ride.dlname} on ${Offer.getTimeString(ride.ridetime)}. ${Offer.genRideLink(ride.dmessageid, ride.dchannelid, ride.dguildid)}\n`;
           //} else {
            //ridesText += `${ride.displayname} is looking for a ride from ${ride.originname} to ${ride.destinname} on ${Request.getTimeString(ride.departuretime)}. ${Request.genRideLink(ride.messageid, ride.channelid, ride.guildid)}\n`;
        //}
        count++;
    }
    pgClient.end();

    if(ridesText == "" ){
        return false; 
    }
    result.addFields({name: "Results:", value: ridesText});
    result.addFields({name: "See All Results:", value: hyperlink("Advanced Search", `${constants.HOSTNAME}search.html?q=${q}`, "Advanced Search")});
    return result;
}
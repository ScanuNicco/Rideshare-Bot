const { SlashCommandBuilder, EmbedBuilder, hyperlink } = require('discord.js');
const constants = require('../constants.js');
const { Offer, Request } = require('../rideEventBuilder.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName("search")
        .setDescription("Search for an Offer or Request")
        .addStringOption(option =>
			option
				.setName('query')
				.setDescription('Where do you want to go?')
                .setRequired(true)),
	execute(interaction) {
        const query = interaction.options.getString("query");
        const result = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Search results: ${query}`);
        var offers = Offer.loadEvents();
        var requests = Request.loadEvents();
        var ridesText = "";
        var count = 0;
        for(const key in offers){
            ride = new Offer(offers[key]);
            if(ride.dest.toLowerCase().includes(query.toLowerCase())) {
                if(count >= 10){
                    break;
                }
                ridesText += ride.writeUpdateText();
                count++;
            }
        }
        for(const key in requests){
            ride = new Request(requests[key]);
            if(count >= 10){
                break;
            }
            if(ride.dest.toLowerCase().includes(query.toLowerCase())) {
                ridesText += ride.writeUpdateText();
                count++;
            }
        }
        if(ridesText == ""){
            ridesText = "No Results. Try posting an Offer or Request";
        }
        result.addFields({name: "Results:", value: ridesText});
        result.addFields({name: "See All Results:", value: hyperlink("Advanced Search", `${constants.HOSTNAME}search.html?q=${query}`, "Advanced Search")});
		interaction.reply({embeds: [result]});
	},
};

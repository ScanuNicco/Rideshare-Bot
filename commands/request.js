const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./ridedata');
const { RideCommandBuilder, Request } = require('../rideEventBuilder.js');

module.exports = {
	data: new RideCommandBuilder('request', 'Ask for a ride')
		.addDefaultOptionals(),
	async execute(interaction) {
		var requests = JSON.parse(localStorage.getItem('requests')) ?? [];
		const request = new Request();
		request.fromInteraction(interaction);
		await interaction.reply({content: "Your request has been submitted! It will be included in the today's daily update.", ephemeral: true});
		const userDM = await request.target.createDM();
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
		const controls = await userDM.send({content: "**Handy Control Panel:** Ride request for `" + request.dest + "`", components: [row]});
		requests[controls.id] = request;
		localStorage.setItem('requests', JSON.stringify(requests));

	},
};

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./ridedata');
const { RideCommandBuilder, Offer } = require('../rideEventBuilder.js');

module.exports = {
	data: new RideCommandBuilder('offer', 'Offer a ride')
		.addStringOption(option =>
			option.setName('vehicle-description')
				.setDescription('Describe your vehicle so riders know how much they can pack.')
				.setRequired(true))
		.addDefaultOptionals(),
	async execute(interaction) {
		var rides = JSON.parse(localStorage.getItem('rides')) ?? [];
		const offer = new Offer();
		offer.fromInteraction(interaction);
		await interaction.reply({content: "Your offer has been submitted! It will be included in the today's daily update.", ephemeral: true});
		const userDM = await offer.target.createDM();
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
		const controls = await userDM.send({content: "**Handy Control Panel:** Ride offer for `" + offer.dest + "`", components: [row]});
		rides[controls.id] = offer;
		localStorage.setItem('rides', JSON.stringify(rides));
	},
};

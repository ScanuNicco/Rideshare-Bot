const { RideCommandBuilder, Request } = require('../rideEventBuilder.js');

module.exports = {
	data: new RideCommandBuilder('offer', 'Offer a ride'),
	execute(interaction) {
		RideCommandBuilder.genLink(interaction, "offer");
		/*const userDM = await offer.target.createDM();
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
		localStorage.setItem('rides', JSON.stringify(rides));*/
	},
};

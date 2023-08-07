const { RideCommandBuilder, Request } = require('../rideEventBuilder.js');

module.exports = {
	data: new RideCommandBuilder('request', 'Ask for a ride')
		.addBooleanOption(option =>
		option.setName('urgent')
			.setDescription('Only use this if you\'re really in a pinch!')),
	execute(interaction) {
		var urgent = interaction.options.getBoolean("urgent");
		RideCommandBuilder.genLink(interaction, "request", urgent);
	},
};

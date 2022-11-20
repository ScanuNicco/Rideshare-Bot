const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./ridedata');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('emergencyrequest')
		.setDescription('If you\'re really in a pinch or you need to leave today, you can use this command.')
		.addStringOption(option =>
			option.setName('where')
				.setDescription('Where are you going? Keep this under 5 words.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('when')
				.setDescription('When are you going? Be sure to include the numerical date. "Thursday" is not specific enough.')
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('payment')
				.setDescription('Are you expecting/offering payment to cover your share of gas/parking?'))
		.addStringOption(option =>
			option.setName('additional-info')
				.setDescription('Anything else you want to add.')),
	async execute(interaction) {
		var rides = JSON.parse(localStorage.getItem('rides')) ?? [];
		var requests = JSON.parse(localStorage.getItem('requests')) ?? [];
		const target = interaction.user;
		const offering = interaction.options.getString('type') == "offering";
		const dest = interaction.options.getString('where');
		const when = interaction.options.getString('when');
		const payment = interaction.options.getBoolean('payment');
		const info = interaction.options.getString("additional-info")
		await interaction.reply({content: "Your " + (offering ? "offer" : "request") + " has been submitted! Check #daily-updates", ephemeral: true});
		const message = "**" + target.username + "** is desperately looking for a ride to `" + dest + "` on `" + when + "`. " + (payment ? "He/she is " + (offering ? "requesting that you" : "offering to") + " help cover the cost of parking/gas. " : "");
		const update = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(":rotating_light: Urgent Request :rotating_light:")
            .addFields({name: "Details:", value: message}, {name: "Additional Info:", value: (info ?? "None")});
        var channel = await interaction.client.channels.fetch("1027780828794732574");
        channel.send({content: "<@&1027782166811254805>", embeds: [update]});
	},
};

const { SlashCommandBuilder } = require('discord.js');
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./ridedata');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('postride')
		.setDescription('Create a new ride')
		.addStringOption(option =>
			option.setName('type')
				.setDescription('Are you offering a ride or looking for one?')
				.setRequired(true)
				.addChoices(
					{ name: 'Offering a ride', value: "offering" },
					{ name: 'Requesting a ride', value: "requesting" }
				))
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
				.setDescription('Anything else you want to add.'))
		.addUserOption(option =>
                        option.setName('user')
                                .setDescription('Create this request on behalf of another user. Please do not abuse this or it will be removed.')),
	async execute(interaction) {
		var rides = JSON.parse(localStorage.getItem('rides')) ?? [];
		var requests = JSON.parse(localStorage.getItem('requests')) ?? [];
		const target = interaction.options.getUser('user') ?? interaction.user;
		const offering = interaction.options.getString('type') == "offering";
		const dest = interaction.options.getString('where');
		const when = interaction.options.getString('when');
		const payment = interaction.options.getBoolean('payment');
		const info = interaction.options.getString("additional-info")
		await interaction.reply({content: "Your " + (offering ? "offer" : "request") + " has been submitted! It will be included in the today's daily update.", ephemeral: true});
		const message = await interaction.channel.send("**" + target.username + "** is " + (offering ? "offering" : "looking for") + " a ride to `" + dest + "` on `" + when + "`. " + (payment ? "He/she is " + (offering ? "requesting that you" : "offering to") + " help cover the cost of parking/gas. " : "") + "\n\n*Additional Info:*\n" + (info ?? "None"));
		//console.log(message);
		if(offering) {
			rides.push({user: target, dest: dest, when: when, payment: payment, info: info, timestamp: Date.now(), message: message});
			localStorage.setItem('rides', JSON.stringify(rides));
		} else {
			requests.push({user: target, dest: dest, when: when, payment: payment, info: info, timestamp: Date.now(), message: message});
			localStorage.setItem('requests', JSON.stringify(requests));
		}
	},
};

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./ridedata');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('request')
		.setDescription('Ask for a ride')
		.addStringOption(option =>
			option.setName('where')
				.setDescription('Where are you going? Keep this under 5 words.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('when')
				.setDescription('When are you going? Be sure to include the numerical date. "Thursday" is not specific enough.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('whence')
				.setDescription('Where are you leaving from? Keep this under 5 words.'))
		.addBooleanOption(option =>
			option.setName('payment')
				.setDescription('Are you offering payment to cover your share of gas/parking?'))
		.addStringOption(option =>
			option.setName('additional-info')
				.setDescription('Anything else you want to add.'))
		.addUserOption(option =>
			option.setName('user')
				.setDescription('Create this request on behalf of another user. Please do not abuse this or it will be removed.')),
	async execute(interaction) {
		var requests = JSON.parse(localStorage.getItem('requests')) ?? [];
		const target = interaction.options.getUser('user') ?? interaction.user;
		const dest = interaction.options.getString('where');
		const whence = interaction.options.getString('whence');
		var whencestring = "";
		if(whence != null && whence != undefined){
			whencestring = "from `" + whence + "` ";
		}
		const when = interaction.options.getString('when');
		const payment = interaction.options.getBoolean('payment');
		const info = interaction.options.getString("additional-info")
		await interaction.reply({content: "Your request has been submitted! It will be included in the today's daily update.", ephemeral: true});
		const message = await interaction.channel.send("**" + target.username + "** is looking for a ride " + whencestring + "to `" + dest + "` on `" + when + "`. " + (payment ? "He/she is offering to help cover the cost of parking/gas. " : "") + "\n\n*Additional Info:*\n" + (info ?? "None"));
		//console.log(message);
		const userDM = await target.createDM();
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
		const controls = await userDM.send({content: "**Handy Control Panel:** Ride request for `" + dest + "`", components: [row]});
		console.log(controls.id);
		requests[controls.id] = {user: target, dest: dest, whence: whence, whencestring: whencestring, when: when, payment: payment, info: info, timestamp: Date.now(), message: message};
		localStorage.setItem('requests', JSON.stringify(requests));

	},
};

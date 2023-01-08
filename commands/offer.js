const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./ridedata');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('offer')
		.setDescription('Offer a ride'),
		/*.addStringOption(option =>
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
				.setDescription('Are you expecting payment to help cover the cost of gas/parking?'))
		.addStringOption(option =>
			option.setName('additional-info')
				.setDescription('Anything else you want to add.'))
		.addUserOption(option =>
			option.setName('user')
				.setDescription('Create this offer on behalf of another user. Please do not abuse this or it will be removed.')),*/
	async execute(interaction) {
		const modal = new ModalBuilder()
			.setCustomId('offerModal')
			.setTitle('Offer A Ride');

		const whenceInput = new TextInputBuilder({
			custom_id: 'whenceInput',
			label: 'Whence',
			placeholder: 'Where are you leaving from? (Optional)',
			required: false,
			style: TextInputStyle.Short,
		});

		const ar1 = new ActionRowBuilder().addComponents(whenceInput);

		const whereInput = new TextInputBuilder({
			custom_id: 'whereInput',
			label: 'Where',
			placeholder: 'Where are you headed?',
			style: TextInputStyle.Short,
		});

		const ar2 = new ActionRowBuilder().addComponents(whereInput);

		const infoInput = new TextInputBuilder({
			custom_id: 'infoInput',
			label: 'Additional Info',
			placeholder: 'Anything else you want to add? (Optional)',
			required: false,
			style: TextInputStyle.Paragraph
		});

		const ar3 = new ActionRowBuilder().addComponents(infoInput);

		const paymentMenu = new StringSelectMenuBuilder({
			custom_id: 'paymentMenu',
			placeholder: 'Select an Option',
			max_values: 1,
			options: [
				{ label: 'Yes', value: 'yes' },
				{ label: 'No', value: 'no' },
			],
		});

		const ar4 = new ActionRowBuilder().addComponents(paymentMenu);

		// Add inputs to the modal
		modal.addComponents(ar1);
		modal.addComponents(ar2);
		modal.addComponents(ar4);
		modal.addComponents(ar3);

		interaction.showModal(modal);

		return;
		var rides = JSON.parse(localStorage.getItem('rides')) ?? [];
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
		await interaction.reply({content: "Your offer has been submitted! It will be included in the today's daily update.", ephemeral: true});
		const message = await interaction.channel.send("**" + target.username + "** is offering a ride " + whencestring + "to `" + dest + "` on `" + when + "`. " + (payment ? "He/she is requesting that you help cover the cost of parking/gas. " : "") + "\n\n*Additional Info:*\n" + (info ?? "None"));
		//console.log(message);
		const userDM = await target.createDM();
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
		const controls = await userDM.send({content: "**Handy Control Panel:** Ride offer for `" + dest + "`", components: [row]});
		rides[controls.id] = {user: target, dest: dest, whence: whence, whencestring: whencestring, when: when, payment: payment, info: info, timestamp: Date.now(), message: message};
		localStorage.setItem('rides', JSON.stringify(rides));
	},
};

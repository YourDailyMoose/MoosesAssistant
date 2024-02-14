const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { botColours } = require('../../index.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Bans the specified user')
		.addUserOption(option => option.setName('target').setDescription('The member to ban').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('Reason for ban').setRequired(true))
    .setDMPermission(false),
		
	async execute(interaction) {
		const user = interaction.options.getUser('target');
		const reason = interaction.options.getString('reason');
		
		try {
			await interaction.guild.members.ban(user, { reason: reason });

      const banEmbed = new EmbedBuilder()
      .setColor(botColours.green)
      .setTitle('User has been Banned')
      .setDescription(`${user.tag} has been banned.`)
      .addFields(
        { name: 'Reason:', value: reason },
        { name: 'Moderator:', value: interaction.user.tag }
        );
			
			interaction.reply({ embeds: [banEmbed] });
		} catch (error) {
			console.error(error);
			interaction.reply('An error occurred while trying to ban the user.');
		}
	},
};

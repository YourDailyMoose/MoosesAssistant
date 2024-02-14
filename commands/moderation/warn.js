const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addWarning } = require('../../database.js');
const { botColours } = require('../../index.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user.')
    .addUserOption(option => option.setName('user').setDescription('The user to warn').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason for the warning').setRequired(true)),
  async execute(interaction) {
    try {
      const userToWarn = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');

      if (!userToWarn || !reason) {
         interaction.reply({ content: 'Missing required parameters.', ephemeral: true });
        return;
      }

      // Log the warning to the database
      await addWarning(interaction.guild.id, userToWarn.tag, userToWarn.id, interaction.user.id, reason);

      const warnedEmbed = new EmbedBuilder()
        .setColor(botColours.green)
        .setTitle('User Warned')
        .setDescription(`**User:** ${userToWarn.tag}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}`)

       interaction.reply({ embeds: [warnedEmbed] });
    } catch (error) {
      console.error("An error occurred:", error);
       interaction.reply({ content: 'An error occurred while issuing the warning.', ephemeral: true });
    }
  }
}

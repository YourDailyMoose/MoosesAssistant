const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getWarnings } = require('../../database.js');
const { botColours } = require('../../index.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modlogs')
    .setDescription('List punishments for a user.')
    .addUserOption(option => option.setName('user').setDescription('The user to list punishments for').setRequired(true))
    .addStringOption(option =>
      option.setName('scope')
        .setDescription('The scope of the punishments to list')
        .setRequired(true)
        .addChoices(
          { name: 'Global', value: 'global' },
          { name: 'Local', value: 'local' },
        )),



  async execute(interaction) {

    const user = interaction.options.getUser('user');
    const scope = interaction.options.getString('scope');

    let guildId = null;
    if (scope === 'guild') {
      guildId = interaction.guild.id;
    }

    const warnings = await getWarnings(user.id, guildId);

    if (warnings.length === 0) {
      const noPunishmentsEmbed = new EmbedBuilder()
        .setColor(botColours.amber)
        .setTitle('No Punishments')
        .setDescription(`No punishments were found for ${user.tag}.`);

      await interaction.reply({ embeds: [noPunishmentsEmbed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`Warnings for ${user.tag}`)
      .setColor(botColours.primary)
      .setDescription(warnings.map((warn, index) => {
        return `**Warning ${index + 1}**\nModerator: <@${warn.moderatorId}>\nReason: ${warn.reason}\nDate: ${new Date(warn.timestamp).toUTCString()}`;
      }).join('\n\n'));

    await interaction.reply({ embeds: [embed] });
  },
};

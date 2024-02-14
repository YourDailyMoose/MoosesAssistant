const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { botColours } = require('../../index.js');

module.exports = {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDMPermission(false)
    .setDescription('Sends a DM to a user.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to send the DM to.')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to send.')
        .setRequired(true)),
  async execute(interaction) {

    if (interaction.user.id === '574783977223749632') {
      const user = interaction.options.getUser('user');
      const message = interaction.options.getString('message');

      const dmEmbed = new EmbedBuilder()
        .setTitle(`Message from ${interaction.user.tag}`)
        .setColor(botColours.primary);

      const dmContentEmbed = new EmbedBuilder()
        .setDescription(message)
        .setColor(botColours.gray)
        .setFooter({ text: `Sent from ${interaction.guild.name} (${interaction.guild.id})`, iconURL: interaction.guild.iconURL() })
        .setTimestamp()


      try {
        await user.send({ embeds: [dmEmbed, dmContentEmbed] });

        const successEmbed = new EmbedBuilder()
          .setTitle('Sent')
          .setColor(botColours.green)
          .setDescription(`Successfully sent a DM to ${user.tag}.`);

        await interaction.reply({ embeds: [successEmbed] });
      } catch (error) {
        console.error(error);
        if (error.code === 50007) {
          // User has DMs disabled
          await interaction.reply({ content: 'Unable to send a DM. The user may have DMs disabled.' });
        }
      }
    } else {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }
  },
};

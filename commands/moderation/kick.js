const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { botColours } = require('../../index.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDMPermission(false)
    .setDescription('Select a member and kick them from the server.')
    .addUserOption(option => option.setName('target').setDescription('The member to kick').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason for kicking the member').setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id === '574783977223749632') {

      const targetMember = interaction.options.getMember('target');

      // You can provide more context for the reason, or just set it to a default value.
      const reason = interaction.options.getString('reason') || 'No reason provided.';

      try {
        await targetMember.kick(reason);

        const kickedEmbed = new EmbedBuilder()
          .setTitle('User has been kicked')
          .setColor(botColours.green)
          .setDescription(`Successfully kicked ${targetMember} for \`${reason}.\``)
          .setTimestamp()
        interaction.reply( { embeds: [kickedEmbed] } );
      } catch (error) {
        console.error(error);

        const errorEmbed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription(`There was an error kicking ${targetMember}.`)
        .setColor(botColours.red)
        
        interaction.reply({ embeds: [errorEmbed] });
      }
    } else {
      return interaction.reply("You don't have the permission to kick members.");
    }

  }
};

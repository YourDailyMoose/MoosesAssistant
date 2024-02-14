const { SlashCommandBuilder } = require('discord.js');
const { deletePunishment } = require('../../database.js');
const botColours = require('../../index.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deletepunishment')
    .setDescription('Delete a specific punishment.')
    .addStringOption(option =>
      option.setName('punishmentid')
        .setDescription('The ID of the punishment to delete')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Check for moderator permissions (you can adjust this as needed)
    if (interaction.user.id === '574783977223749632') {

      
      const punishmentId = interaction.options.getString('punishmentid');

      const result = await deletePunishment(punishmentId);

      if (result) {

        const successEmbed = new EmbedBuilder()
        .setColor(botColours.green)
        .setTitle('Punishment Deleted')
        .setDescription(`Punishment with ID ${punishmentId} has been deleted.`)
        .setTimestamp();
        
        interaction.reply({ embeds: [successEmbed] });
      } else {

        const notfoundEmbed = new EmbedBuilder()
        .setColor(botColours.red)
        .setTitle('Error')
        .setDescription(`Punishment with ID ${punishmentId} not found.`)
        
        interaction.reply( { embeds: [notfoundEmbed] } );
      }
    } else {
      interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }
  }
};

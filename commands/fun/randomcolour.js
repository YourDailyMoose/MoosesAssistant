let fetch;

import('node-fetch').then(module => {
  fetch = module.default;
});

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('randomcolor')
    .setDescription('Generates a random color and displays it in an embed.'),
  
  async execute(interaction) {
    // Make sure fetch is imported
    if (!fetch) {
      return interaction.reply('The fetch library is not yet loaded.');
    }

    // Generate a random color
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    // Convert to HEX
    const hex = '#' + ((r << 16) + (g << 8) + b).toString(16).padStart(6, '0');

    // Generate an image URL using a placeholder service
    const imageUrl = `https://www.colorhexa.com/${hex.slice(1)}.png`;

    // Create an embed
    const embed = new EmbedBuilder()
      .setColor(hex)
      .setTitle('Random Color')
      .setDescription(`Hex: ${hex}\nRGB: ${r}, ${g}, ${b}`)
      .setImage(imageUrl);
    
    // Send the embed
    await interaction.reply({ embeds: [embed] });
  },
};
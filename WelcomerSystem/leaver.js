const { EmbedBuilder, WebhookClient } = require('discord.js')
const { botColours } = require('../index.js');

function runLeaver(guildId, member) {

  const serverWelcomeSettings = {
    '736727136618020868': { // Moose's Assistant
      channelId: '1144258112912637952',
      webhookURL: null,
      embed: new EmbedBuilder()
        .setColor(botColours.amber) // Green color
        .setTitle(`${member.user.username} has left the server!`)
        .setDescription(`Sadly, ${member.user.username} has left the server. We hope to see you again soon!`)
        .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() }),

    },
    '1145881527746560051': { // The Refined Assembly
      channelId: '1146081135173046272',
      webhookURL: process.env.therefinedassembly_webhook_url,
      embed: new EmbedBuilder()
        .setColor(botColours.red) // Red color
        .setTitle('Welcome to The Refined Assembly')
        .setDescription('Welcome to the server!'),
    },
  };

  // Check if the server is in the mapping
  if (guildId in serverWelcomeSettings) {

    if (member.user.bot) {
      return;
    }
    const { channelId, embed, webhookURL } = serverWelcomeSettings[guildId];

    // Get the specified welcome channel
    const welcomeChannel = member.guild.channels.cache.get(channelId);

    if (welcomeChannel) {
      if (webhookURL) {
        // If a webhook URL is specified, send the embed through the webhook
        const webhook = new WebhookClient({ url: webhookURL });
        webhook.send({ embeds: [embed] });
      } else {
        // If no webhook URL is specified, send the embed through the bot
        welcomeChannel.send({ embeds: [embed] });
      }
    }
  }
}

module.exports = {
    runLeaver: runLeaver
};
const { EmbedBuilder, WebhookClient } = require('discord.js')
const { botColours } = require('../index.js');

function runWelcomer(guildId, member) {

  const serverWelcomeSettings = {
    '736727136618020868': { // Moose's Assistant
      channelId: '1144258112912637952',
      webhookURL: null,
      embed: new EmbedBuilder()
        .setColor(botColours.green) // Green color
        .setTitle(`Welcome, ${member.user.username}!`)
        .setDescription('Greetings! Welcome to the server!\n\nWe ask that you please read the <#1144257898663387136>. Once you have done that, feel free to start playing with the bots or start chatting to other people in the server! Have Fun!')
        .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() })
        .setImage(member.user.avatarURL()),

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
    runWelcomer: runWelcomer
};
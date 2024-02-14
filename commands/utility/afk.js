const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const { botColours } = require('../../index.js');

// Create a map to store AFK status
const afkMap = new Map();

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Marks you as AFK.')
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for being AFK')
        .setRequired(false)
    ),
  handleMentions,
  async execute(interaction) {
    const userId = interaction.user.id;
    if (afkMap.has(userId)) {
      // Remove AFK status if already AFK
      afkMap.delete(userId);

      const embed = new EmbedBuilder()
        .setTitle("Your AFK status has been removed")
        .setColor(botColours.green)
        .setTimestamp()

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      const reason = interaction.options.getString('reason') || 'No reason provided';

      // Mark the user as AFK in the map
      afkMap.set(userId, reason);

      const embed = new EmbedBuilder()
        .setTitle("You have been marked as AFK")
        .setDescription(`Reason: ${reason}`)
        .setColor(botColours.green)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}

function isWithinTime(startTime, endTime, currentTime) {
  return currentTime >= startTime && currentTime <= endTime;
}

const userId = '574783977223749632'

const lastMessageMap = new Map(); 


function handleMentions(message, client) {
  // Ignore bot messages
  if (message.author.bot) {
    return;
  }

  if (message.author.id === userId) {
    lastMessageMap.set(message.author.id, Date.now());
  }

  const sydneyTime = DateTime.now().setZone("Australia/Sydney");

  const hour = sydneyTime.hour;
  const minute = sydneyTime.minute;
  const weekday = sydneyTime.weekday;

  const currentTimeInMinutes = hour * 60 + minute;

  const commonUnavailableTimes = [
    { start: 9 * 60, end: 11 * 60 + 7 },
    { start: 11 * 60 + 37, end: 13 * 60 + 39 },
    { start: 14 * 60 + 9, end: 15 * 60 + 10 },
    { start: 18 * 60 + 30, end: 20 * 60 + 30 }
  ];

  const tuesdayUnavailableTimes = [
    { start: 9 * 60, end: 10 * 60 + 26 },
    { start: 10 * 60 + 56, end: 12 * 60 + 58 },
    { start: 13 * 60 + 28, end: 15 * 60 }
  ];

  const everydayUnavailableTimes = [
    { start: 22 * 60, end: 24 * 60 },
    { start: 0, end: 7 * 60 }
  ];

  const isCommonUnavailableDay = [1, 3, 4, 5].includes(weekday);  // Monday, Wednesday, Thursday, Friday
  const isTuesday = weekday === 2;
  const isWednesday = weekday === 3;

  // Function to check if current time is within any of the specified unavailable times
  function isCurrentTimeUnavailable(unavailableTimes) {
    return unavailableTimes.some(time => isWithinTime(time.start, time.end, currentTimeInMinutes));
  }

  message.mentions.users.forEach(async (user) => {

    if (user.id === userId) {
      // check if the user has sent a message in the last 5 minutes
      const lastMessageTimestamp = lastMessageMap.get(user.id);
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

      if (lastMessageTimestamp && lastMessageTimestamp > fiveMinutesAgo) {
        return;
      }
    }

    if (afkMap.has(user.id)) {
      const reason = afkMap.get(user.id);
      await message.reply(`${user.tag} is currently AFK for: ${reason}`);
    } else if (user.id === userId) {
      let isUnavailable = false;

      if (isCommonUnavailableDay) {
        isUnavailable = isCurrentTimeUnavailable(commonUnavailableTimes);
      }

      if (isTuesday) {
        isUnavailable = isCurrentTimeUnavailable(tuesdayUnavailableTimes);
      }

      if (isWednesday) {
        const additionalWednesdayTimes = [{ start: 18 * 60 + 30, end: 20 * 60 + 30 }];
        isUnavailable = isCurrentTimeUnavailable(commonUnavailableTimes.concat(additionalWednesdayTimes));
      }

      if (isCurrentTimeUnavailable(everydayUnavailableTimes)) {
        isUnavailable = true;
      }

      if (isUnavailable) {
        const embed = new EmbedBuilder()
          .setTitle('Moose is Unavailable')
          .setDescription(`Hey there! Moose is currently unavailable. He'll reply to you when he's back online. Thank you!`)
          .setColor(botColours.amber)
          .setTimestamp();

        await message.reply({ embeds: [embed] });
      }
    }
  });
}
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sendrules')
    .setDescription('Sends the rules to the channel.'),
  
  async execute(interaction) {
if (interaction.user.id === '574783977223749632') {
    const rulesEmbed1 = new EmbedBuilder()
      .setTitle("Moose's Bot Studio | Server Rules & Guidelines")
      .setDescription(":wave: Hi there! \n\nWelcome to the Moose's Bot Studio. We have some rules that everyone needs to follow to make sure that this continues to be a positive and respectful place. Breaking these rules will result in disciplinary action being taken against you.\n\nThanks for understanding and helping us keep this a safe environment for everyone!")
      .setColor('#61c2ff')

    const rulesEmbed2 = new EmbedBuilder()
      .setTitle("Rules and Guidelines")
      .setDescription("1. Let's keep things civil in our chats by avoiding explicit language and avoiding ways to bypass our chat filters. However, swearing is permitted but will be moderated if used in derogatory or offensive ways.\n2. We ask that you refrain from using our server for advertising purposes through DMs or otherwise.\n3. It's important that everyone feels welcome and comfortable in our server, so let's avoid drama and arguments. If you disagree with someone, please try to handle it respectfully.\n4. To protect everyone's safety, we do not allow any malicious links or files to be posted.\n5. Our server is a safe space for all members, so please do not post NSFW or other explicit content, including language, violence, and gore.\n6. We do not tolerate any discrimination or harassment against anyone, including based on their race, religion, sexuality, gender identity, or any other personal characteristic.\n7. It is important to respect everyone's privacy by not sharing or collecting their details or private images without consent.\n8. We are all here to have fun and make connections, so let's be respectful and kind to one another.\n9. While we appreciate discussion and debate, let's avoid discussingn sensitive or controversial topics such as politics or religion.\n10. Let's all use common sense while in the server and follow the rules to ensure a safe and positive community experience.\n11. Please do not try to find loopholes in the rules or attempt to circumvent them in any way.\n12. To avoid disturbing other members, please do not use annoying or loud sounds in voice channels.\n13. As required by Discord's terms of service, all members of our server must be aged 13 or above. Please see https://support.discord.com/hc/en-us/articles/360040724612 for more details on this rule.\n14. To keep things organized, please keep bot commands in #bot-commands or the testing channels.\n15. Let's respect each other's time and attention by not ghost-pinging or pinging other community members for no reason.\n16. All members are required to follow Discord's community guidelines. Failure to do so will result in disciplinary action. You can find Discord's community guidelines here: https://discord.com/guidelines\n\nThank you for taking the time to read the rules. Your cooperation in following them is greatly appreciated.")
      .setColor('#61c2ff')
    const rulesEmbed3 = new EmbedBuilder()
      .setTitle("Information")
      .setDescription("Moderators have the final say on all discord punishments. Staff reserve the right to punish you as they see fit, within reasonable limits.\n\nIf you have any questions or concerns, please contact <@574783977223749632>\n\n**Links**\n\n> <:github:1144529970941673523> GitHub - https://github.com/YourDailyMoose\n> <:discord:1144547123602395196> Discord Server - https://discord.gg/BwD7MgVMuq")
      .setColor('#61c2ff')
      .setFooter({ text: "Written by YourDailyMoose | Updated" })
      .setTimestamp()

    interaction.channel.send({ embeds: [rulesEmbed1, rulesEmbed2, rulesEmbed3] })
  } else {
      interaction.reply('You are not authorized to run this command.');
    }
  } }

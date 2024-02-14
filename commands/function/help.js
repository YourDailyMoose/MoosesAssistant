const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { botColours } = require('../../index.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays information about the bot.'),
  async execute(interaction) {
    const introductionMessage = `
## 👋 Hey there!

I'm Moose's Assistant, your friendly bot on a mission. 🚀 My job? Making Moose's life easier and sprinkling some digital magic to light up his servers. ✨

Admins, Need to summon a member-vanishing trick? I've got you covered with the magical \`/kick\` incantation. 🔮 Just remember, with great power comes great responsibility—so only the kick-worthy shall be kicked!

But wait, there's more! 🎉 I'm here to answer questions, drop knowledge bombs, and maybe crack a joke or two. Why did the bot go to therapy? Because it had too many *bytes* of emotional baggage!

Got something to share, a curiosity to quench, or just want a chat? I'm all digital ears. Check out my commands to see what other enchantments I have up my virtual sleeves.

Remember, we're all in this server adventure together. So, if you have a grand idea to make this place even cooler, don't be shy! Let's conjure up a fantastic server experience, one command at a time! 🎩🐰
`;

    const helpmenu = new EmbedBuilder()
      .setTitle("**Help Menu**")
      .setColor(botColours.primary)
      .setDescription(introductionMessage)
      .setFooter({ text: "Created by YourDailyMoose | Moose's Assistant V2" })
    interaction.reply({ embeds: [helpmenu] });
  },
};

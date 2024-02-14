const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guildlist')
        .setDescription('Lists the guilds the bot is in and allows you to select guilds for the bot to leave'),
    async execute(interaction) {

        if (interaction.user.id === '574783977223749632') {
            // Create an array of options for the select menu
            const guildOptions = interaction.client.guilds.cache.map((guild) => {
                return {
                    label: guild.name,
                    description: `Guild ID: ${guild.id}`,
                    value: guild.id,
                };
            });

            // Create the select menu
            const selectMenu = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select_guild')
                        .setPlaceholder('Select a guild to leave')
                        .addOptions(guildOptions)
                );

            // Send the select menu
            await interaction.reply({ content: 'This is a list of guilds Moose\'s Assistant is in.', components: [selectMenu] });
        } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
    },
};
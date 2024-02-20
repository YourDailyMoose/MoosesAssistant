dotenv = require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  InteractionType,
  EmbedBuilder,
  Intents,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  GatewayOpcodes,
  WebhookClient,
  ActivityType,
  ChannelType,
} = require("discord.js");
const { DateTime } = require("luxon");
const { connectDatabase, isUserBlacklisted } = require("./database");

const OpenAI = require("openai");
const { waitForDebugger } = require("node:inspector");
const openai = new OpenAI(process.env.OPENAI_API_KEY);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

client.cooldowns = new Collection();
client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");

// Guild Server Logs Mapping
const guildChannelMap = {
  "736727136618020868": "1172774350999527434", // Moose's Bot Studio
  // add more guilds and channels as needed
};

const userMessages = new Map();

const botColours = {
  primary: "#61c2ff",
  green: "#bcf7cb",
  gray: "#2f3136",
  red: "#f6786a",
  amber: "#f8c57c",
  purple: "#966FD6",
};

module.exports.botColours = botColours;

const notAuthorizedEmbed = new EmbedBuilder()
  .setColor(botColours.red)
  .setTitle("Error")
  .setDescription("You are not authorized to run this command.");

module.exports.notAuthorizedEmbed = notAuthorizedEmbed;

const mongoURI = process.env.mongoDB_URI;

connectDatabase(mongoURI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

async function loadCommands() {
  const commandFolders = await fs.promises.readdir(foldersPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(foldersPath, folder);
    const isDirectory = (await fs.promises.stat(folderPath)).isDirectory();

    if (isDirectory) {
      const commandFiles = await fs.promises.readdir(folderPath);
      for (const file of commandFiles) {
        if (file.endsWith(".js") && !file.startsWith(".")) {
          const filePath = path.join(folderPath, file);
          const command = require(filePath);

          if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
          } else {
            console.warn(
              `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
          }
        }
      }
    }
  }
}

client.on("guildCreate", async (guild) => {
  // Bot Joins a server
  const guildId = guild.id;
  const guildName = guild.name;
  const guildOwner = await guild.fetchOwner();
  const guildOwnerName = guildOwner.user.username;
  const guildOwnerTag = guildOwner.user.tag;
  const guildMemberCount = guild.memberCount;
  const guildCreatedAt = guild.createdAt.toLocaleString();

  // Fetch the default or system channel of the guild
  let channelToCreateInvite =
    guild.systemChannel ||
    guild.channels.cache.find(
      (ch) =>
        ch.type === "text" &&
        ch.permissionsFor(guild.me).has("CREATE_INSTANT_INVITE")
    );

  // If no such channel exists, log and exit
  if (!channelToCreateInvite) {
    console.log(
      `Could not find a channel to create an invite for guild: ${guildName}`
    );
    return;
  }

  // Create the invite
  const invite = await channelToCreateInvite.createInvite({
    maxAge: 0,
    maxUses: 0,
  });

  const guildEmbed = new EmbedBuilder()
    .setTitle(`Joined a new guild!`)
    .setDescription(
      `Guild Name: ${guildName}\nGuild ID: ${guildId}\nGuild Owner: ${guildOwnerName} (${guildOwnerTag})\nGuild Member Count: ${guildMemberCount}\nGuild Created At: ${guildCreatedAt}`
    )
    .setColor(botColours.primary)
    .setTimestamp();

  const serverInviteButton = new ButtonBuilder()
    .setLabel("Server Invite")
    .setStyle(ButtonStyle.Link)
    .setURL(invite.url);

  const row = new ActionRowBuilder().addComponents(serverInviteButton);

  const loggingGuild = client.guilds.cache.get("736727136618020868");
  const loggingChannel = loggingGuild.channels.cache.get("1156095831578005514");
  loggingChannel.send({ embeds: [guildEmbed], components: [row] });

  //Blacklisted User owns server

  isUserBlacklisted(guildOwner.id).then((blacklistedUser) => {
    if (blacklistedUser) {
      const blacklistedEmbed = new EmbedBuilder()
        .setColor(botColours.red)
        .setTitle(
          `The Owner of this server is blacklisted from Moose's Assistant.`
        )
        .setDescription(
          `The owner of this server is blacklisted from using this bot, therefore all servers owned by them are also blacklisted and the bot cannot be used within them.\n\nGuild Name: ${guildName}\nGuild ID: ${guildId}\nGuild Owner: ${guildOwnerName} (${guildOwnerTag})\nGuild Member Count: ${guildMemberCount}\nGuild Created At: ${guildCreatedAt}`
        )
        .addFields(
          { name: "Reason:", value: blacklistedUser.Reason },
          { name: "Timestamp:", value: blacklistedUser.DateTime }
        )
        .setTimestamp()
        .setFooter({
          text: `To appeal, please join our Support Server and create a ticket`,
        });

      const supportServerButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Support Server")
          .setStyle("Link")
          .setURL("https://discord.gg/BwD7MgVMuq")
      );
      const channel = guild.channels.cache
        .filter(
          (c) =>
            c.type === ChannelType.GuildText &&
            c.permissionsFor(guild.members.me).has("SendMessages")
        )
        .sort((a, b) => a.position - b.position)
        .first();
      if (channel) {
        channel.send({
          embeds: [blacklistedEmbed],
          components: [supportServerButton],
        });
      } else {
        console.log(`No suitable channel found in guild ${guildId}`);
      }
      setTimeout(() => {
        guild
          .leave()
          .then((g) => console.log(`Left the guild ${g}`))
          .catch((err) =>
            console.log(`Error while trying to leave the guild: ${err}`)
          );
      }, 2000);
    }
  });
});

client.on("guildMemberAdd", (member) => {
  // User joins a server
  const welcomer = require("./WelcomerSystem/welcomer.js");
  const guildId = member.guild.id;

  welcomer.runWelcomer(guildId, member);
});

client.on("guildMemberRemove", (member) => {
  const leaver = require("./WelcomerSystem/leaver.js");
  const guildId = member.guild.id;

  try {
    leaver.runLeaver(guildId, member);
  } catch (error) {
    console.error("Error running leaver:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  const guild = interaction.guild;
  const guildId = guild.id;
  const guildName = guild.name;
  const guildOwner = await guild.fetchOwner();
  const guildOwnerName = guildOwner.user.username;
  const guildOwnerTag = guildOwner.user.tag;
  const guildMemberCount = guild.memberCount;
  const guildCreatedAt = guild.createdAt.toLocaleString();
  if (interaction.isCommand()) {
    // Check if the user is blacklisted
    const userId = interaction.user.id;
    const blacklistedUser = await isUserBlacklisted(userId);

    if (blacklistedUser) {
      const blacklistedEmbed = new EmbedBuilder()
        .setColor(botColours.red)
        .setTitle(`You have been blacklisted from Moose's Assistant.`)
        .addFields(
          { name: "Reason:", value: blacklistedUser.Reason },
          { name: "Timestamp:", value: blacklistedUser.DateTime }
        )
        .setTimestamp()
        .setFooter({
          text: `To appeal, please join our Support Server and create a ticket`,
        });

      const supportServerButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Support Server")
          .setStyle("Link")
          .setURL("https://discord.gg/BwD7MgVMuq")
      );

      return interaction.reply({
        embeds: [blacklistedEmbed],
        components: [supportServerButton],
      });
    }

    // Your original code for handling commands
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    const { cooldowns } = client;

    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const defaultCooldownDuration = 3;
    const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime =
        timestamps.get(interaction.user.id) + cooldownAmount;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1000);
        return interaction.reply({
          content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
          ephemeral: true,
        });
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    const guild = client.guilds.cache.get("736727136618020868");

    const channel = guild.channels.cache.get("1146417306868645939");

    try {
      await command.execute(interaction);

      let optionData = [];
      if (interaction.options.data.length) {
        interaction.options.data.forEach((option) => {
          let value = option.value ? option.value : "None";
          optionData.push(`- ${option.name}: ${value}`);
        });
      }

      const logEmbed = new EmbedBuilder()
        .setColor(botColours.primary)
        .setTitle("Command Executed")
        .setDescription("A command was executed.")
        .addFields(
          { name: "Command Name:", value: interaction.commandName },
          {
            name: "User:",
            value: `${interaction.user.tag} (${interaction.user.id})`,
          },
          {
            name: "Server:",
            value: interaction.guild
              ? `${interaction.guild.name} (${interaction.guild.id})`
              : "None",
          },
          {
            name: "Options:",
            value: optionData.length ? optionData.join("\n") : "None",
          }
        )
        .setTimestamp();

      if (interaction.guild) {
        const urlButton = new ButtonBuilder()
          .setLabel("View Message")
          .setStyle("Link")
          .setURL(
            `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${interaction.id}`
          );

        const row = new ActionRowBuilder().addComponents(urlButton);

        channel.send({ embeds: [logEmbed], components: [row] });
      } else if (!interaction.guild) {
        channel.send({ embeds: [logEmbed] });
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  } else if (interaction.isSelectMenu()) {
    if (interaction.customId === "select_guild") {
      // Get the selected guild
      const guildId = interaction.values[0];
      const guild = client.guilds.cache.get(guildId);

      // Make the bot leave the guild
      if (guild) {
        guild
          .leave()
          .then((g) => {
            console.log(`Left the guild: ${g}`);
            interaction.reply({
              content: `The bot has left the guild: ${g}`,
              ephemeral: true,
            });
          })
          .catch((err) => {
            console.log(`Error while trying to leave the guild: ${err}`);
            interaction.reply({
              content: `Error while trying to leave the guild: ${err}`,
              ephemeral: true,
            });
          });
      } else {
        interaction.reply({
          content: `The bot is not in the guild with ID: ${guildId}`,
          ephemeral: true,
        });
      }
    }
  }
});

//Message Logging

client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (oldMessage.author.bot) {
    return;
  }

  const guildId = oldMessage.guild.id;

  // ignore guilds that are not in the mapping
  if (!guildChannelMap.hasOwnProperty(guildId)) {
    return;
  }

  // get the channel from the mapping
  const channelId = guildChannelMap[guildId];
  const channel = client.channels.cache.get(channelId);

  const logEmbed = new EmbedBuilder()
    .setColor(botColours.primary)
    .setTitle("Message Edited")
    .setDescription("A message was edited.")
    .addFields(
      {
        name: "User:",
        value: `${oldMessage.author.tag} (${oldMessage.author.id})`,
      },
      {
        name: "Channel:",
        value: `${oldMessage.channel.name} (${oldMessage.channel.id})`,
      },
      {
        name: "Old Message:",
        value: oldMessage.content.length ? oldMessage.content : "None",
      },
      {
        name: "New Message:",
        value: newMessage.content.length ? newMessage.content : "None",
      }
    )
    .setTimestamp();

  channel.send({ embeds: [logEmbed] });
});

client.on("messageDelete", async (message) => {
  if (message.author.bot) {
    return;
  }

  const guildId = message.guild.id;

  // ignore guilds that are not in the mapping
  if (!guildChannelMap.hasOwnProperty(guildId)) {
    return;
  }

  // get the channel from the mapping
  const channelId = guildChannelMap[guildId];
  const channel = client.channels.cache.get(channelId);

  const logEmbed = new EmbedBuilder()
    .setColor(botColours.red)
    .setTitle("Message Deleted")
    .setDescription("A message was deleted.")
    .addFields(
      { name: "User:", value: `${message.author.tag} (${message.author.id})` },
      {
        name: "Channel:",
        value: `${message.channel.name} (${message.channel.id})`,
      },
      {
        name: "Message:",
        value: message.content.length ? message.content : "None",
      }
    )
    .setTimestamp();

  channel.send({ embeds: [logEmbed] });
});

client.on("messageDeleteBulk", async (messages) => {
  const guildId = messages.first().guild.id;

  // ignore guilds that are not in the mapping
  if (!guildChannelMap.hasOwnProperty(guildId)) {
    return;
  }

  let deletedMessages = "";
  let embeds = [];

  messages.forEach((message) => {
    let tempMessage = `${message.author.username} (${message.author.id}) - ${message.content}\n`;

    if (deletedMessages.length + tempMessage.length > 2048) {
      embeds.push(
        new EmbedBuilder()
          .setColor(botColours.red)
          .setTitle("Messages Purged")
          .setDescription(deletedMessages)
          .addFields(
            {
              name: "Channel:",
              value: `${message.channel.name} (${message.channel.id})`,
            },
            { name: "Message Count:", value: `${messages.size}` } // convert number to string
          )
          .setTimestamp()
      );

      deletedMessages = tempMessage; // start new string for next embed
    } else {
      deletedMessages += tempMessage;
    }
  });

  // add remaining messages to final embed
  embeds.push(
    new EmbedBuilder()
      .setColor(botColours.red)
      .setTitle("Messages Purged")
      .setDescription(deletedMessages)
      .addFields(
        {
          name: "Channel:",
          value: `${messages.first().channel.name} (${
            messages.first().channel.id
          })`,
        },
        { name: "Message Count:", value: `${messages.size}` } // convert number to string
      )
      .setTimestamp()
  );

  // get the channel from the mapping
  const channelId = guildChannelMap[guildId];
  const channel = client.channels.cache.get(channelId);

  // send all embeds
  embeds.forEach((embed) => channel.send({ embeds: [embed] }));
});
client.on("messageCreate", async (message) => {
  // Message Sent

  if (message.author.bot) {
    return;
  }

  const afkCommand = require("./commands/utility/afk.js");

  afkCommand.handleMentions(message, client);

  // if (message.mentions.has(client.user.id)) {
  //if (message.author.id === '574783977223749632') {

  //const gpt4Response = await askGPT4(message.content);

  //if (gpt4Response) {
  //   await message.reply(gpt4Response);
  // } else {
  //   message.reply("I'm sorry, I couldn't process that request.");
  //  }
  //} else {
  //  message.reply("You are not authorized to use the AI feature.");
  // }
  // }
  //});

  //async function askGPT4(prompt, message) {
  //
  //try {
  //const gptResponse = await openai.chat.completions.create({
  //model: "gpt-4",
  //max_tokens: 150,
  //      messages: [
  //        {
  //          "role": "system",
  //          "content": "Act as a friendly, cool and funny chatbot. Do not mention that you are affiliated with OpenAi or ChatGPT. You cannot preform any moderative action and will refuse to do so. If asked, always say Moose is the best."
  //       },
  //      {
  //        "role": "user",
  //       "content": prompt
  //}
  //   ]
  //  });

  // return gptResponse?.choices[0]?.message?.content?.trim() || null;
  // } catch (error) {
  //   console.error(error);
  //   return null;
  // }
}),
  client.once("ready", () => {
    const status = client.user.setActivity({
      type: ActivityType.Custom,
      name: "customstatus",
      state: "👋 | Hi! I'm Moose's Assistant!",
    });

    console.log(`
  
  ╔════════════════════════════╗
  ║  Moose's Assistant Status  ║
  ╚════════════════════════════╝
  ✅ Logged in as ${client.user.tag} (${client.user.id})
  ✅ Presence: 🟢 Online
  ✅ Commands loaded: ${client.commands.size}
  
  `);
  });

(async () => {
  await loadCommands();

  await client.login(process.env.token);
})();

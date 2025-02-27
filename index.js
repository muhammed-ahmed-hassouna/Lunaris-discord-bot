require("dotenv").config();
const { Client, GatewayIntentBits, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");
const fs = require("node:fs");
const path = require("node:path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Map();
client.activeGames = new Map();
client.gameManager = require("./game/GameManager");

// Load commands
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  if (!command || !command.data || !command.data.name) {
    console.error(
      `❌ Error: The command file '${file}' is missing 'data' or 'data.name'.`
    );
    continue;
  }
  client.commands.set(command.data.name, command);
}

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

// Register slash commands
const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

client.once("ready", async () => {
  try {
    console.log(`Logged in as ${client.user.tag}!`);

    await rest.put(Routes.applicationCommands(client.user.id), {
      body: [...client.commands.values()].map((cmd) => cmd.data.toJSON()),
    });

    console.log("Successfully registered application commands!");
  } catch (error) {
    console.error("Failed to register commands:", error);
  }
});

// Handle interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);

    // Check if the interaction has already been replied to
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "\u200F" + "حدث خطأ أثناء تنفيذ هذا الأمر.",
        ephemeral: true,
      });
    } else if (interaction.deferred) {
      await interaction.editReply({
        content: "\u200F" + "حدث خطأ أثناء تنفيذ هذا الأمر.",
      });
    }
  }
});

client.login(process.env.BOT_TOKEN);

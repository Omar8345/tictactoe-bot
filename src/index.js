require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const client = new Client({
  partials: ["CHANNEL"],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildPresences,
  ],
});

client.commands = new Collection();

const foldersPath = path.resolve(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);
let cmdArray = [];

for (const folder of commandFolders) {
  const commandsPath = path.resolve(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.resolve(commandsPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
      if (!client.commands.has(command.data.name)) {
        client.commands.set(command.data.name, command);
        cmdArray.push(command.data.toJSON());
      }
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const uniqueCmdArray = Array.from(
  new Map(cmdArray.map((cmd) => [cmd.name, cmd])).values()
);

const eventsPath = path.resolve(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.resolve(eventsPath, file);
  const event = require(filePath);

  try {
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  } catch (error) {
    console.error(`Error executing event ${event.name}:`, error);
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

async function clearGuildCommands() {
  try {
    console.log("Clearing existing guild commands...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      {
        body: [],
      }
    );
    console.log("Successfully cleared guild commands.");
  } catch (error) {
    console.error("Error clearing guild commands:", error);
  }
}

async function registerCommands() {
  try {
    console.log(
      `Starting to refresh ${uniqueCmdArray.length} application (/) commands.`
    );

    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      {
        body: uniqueCmdArray,
      }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error("Error reloading commands:", error);
  }
}

(async () => {
  try {
    await clearGuildCommands();
    await registerCommands();
  } catch (error) {
    console.error("Error during the command process:", error);
  }
})();

client.login(process.env.TOKEN);

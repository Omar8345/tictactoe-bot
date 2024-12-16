require("dotenv").config();
const { Client, IntentsBitField } = require("discord.js");

const client = new Client({
  intents: [
    IntentsBitField.FLAGS.GUILDS,
    IntentsBitField.FLAGS.GUILD_MESSAGES,
    IntentsBitField.FLAGS.DIRECT_MESSAGES,
  ],
});

client.on("ready", () => {
  console.log(`✅ ${client.user.tag} is online!`);
});

client.login(process.env.TOKEN);

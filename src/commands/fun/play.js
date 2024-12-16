const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Start a game with someone")
    .addUserOption((option) =>
      option
        .setName("opponent")
        .setDescription("The user you want to play with")
        .setRequired(true)
    ),
  /**
   * @param { ChatInputCommandInteraction } interaction
   */
  async execute(interaction) {
    await interaction.reply(`⚒️ This command is still under development.`);
  },
};

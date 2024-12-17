const { Events, ChatInputCommandInteraction } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  /**
   *
   * @param { ChatInputCommandInteraction } interaction
   */
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      return console.error(
        `No command matching ${interaction.commandName} was found in the Commands directory`
      );
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  },
};

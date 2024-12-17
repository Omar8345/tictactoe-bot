const {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

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

  async execute(interaction) {
    const opponent = interaction.options.getUser("opponent");

    if (opponent.id === interaction.user.id) {
      return await interaction.reply({
        content: "You can't play with yourself!",
        ephemeral: true,
      });
    }

    if (!(await isOpponentInServer(opponent, interaction.guild))) {
      return await interaction.reply({
        content: "You can only play with users in this server!",
        ephemeral: true,
      });
    }

    if (opponent.bot) {
      return await interaction.reply({
        content: "You can't play with a bot!",
        ephemeral: true,
      });
    }

    const playButton = new ButtonBuilder()
      .setCustomId(`join_game_${opponent.id}_${interaction.user.id}`)
      .setLabel("Join Game")
      .setStyle(ButtonStyle.Primary);

    const replyMessage = await interaction.reply({
      content: `<@${opponent.id}>, you have been invited to play a game of Tic-Tac-Toe by <@${interaction.user.id}>!`,
      components: [new ActionRowBuilder().addComponents(playButton)],
    });

    const gameLink = generateGameLink(
      interaction.guild.id,
      interaction.channel.id,
      replyMessage.id
    );
    await sendGameInviteToOpponent(opponent, interaction.user.tag, gameLink);
  },
};

async function isOpponentInServer(opponent, guild) {
  try {
    const member = await guild.members.fetch(opponent.id);
    return member ? true : false;
  } catch (err) {
    console.error("Error fetching member:", err);
    return false;
  }
}

function generateGameLink(guildId, channelId, messageId) {
  return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
}

async function sendGameInviteToOpponent(opponent, userTag, gameLink) {
  try {
    await opponent.send({
      content: `${userTag} has invited you to a game of Tic-Tac-Toe! Click the link to join the game: ${gameLink}`,
    });
  } catch (err) {
    console.error("Error sending DM:", err);
  }
}

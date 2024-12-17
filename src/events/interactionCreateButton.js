const {
  Events,
  ButtonInteraction,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");

const gameState = {};

const PLAYER_MARKS = {
  player1: "❌",
  player2: "🅾️",
};

module.exports = {
  name: Events.InteractionCreate,
  /**
   *
   * @param {ButtonInteraction} interaction
   * @returns
   */
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const { customId, user } = interaction;

    if (customId.startsWith("join_game_")) {
      const opponentId = customId.split("_")[2];
      if (opponentId !== user.id) {
        return interaction.reply({
          content: "You can't join a game that isn't yours!",
          ephemeral: true,
        });
      }

      interaction.reply({
        content: "You have joined the game!",
        ephemeral: true,
      });

      const user1 = customId.split("_")[3];
      const user2 = user.id;

      gameState[createGameKey(user1, user2)] = {
        board: Array(9).fill(null),
        currentTurn: user1,
        player1: user1,
        player2: user2,
      };

      const gameButtons = [];
      for (let i = 0; i < 9; i++) {
        gameButtons.push(
          new ButtonBuilder()
            .setCustomId(`game_${user1}_${user2}_${i}`)
            .setLabel("ㅤㅤ")
            .setStyle(ButtonStyle.Primary)
        );
      }

      const rows = [
        new ActionRowBuilder().addComponents(gameButtons.slice(0, 3)),
        new ActionRowBuilder().addComponents(gameButtons.slice(3, 6)),
        new ActionRowBuilder().addComponents(gameButtons.slice(6, 9)),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`end_game_${user1}_${user2}`)
            .setLabel("End Game")
            .setStyle(ButtonStyle.Danger)
        ),
      ];

      const gameMessage = await interaction.message.edit({
        content: `It's <@${user1}>'s turn!`,
        components: rows,
      });

      gameState[createGameKey(user1, user2)].messageId = gameMessage.id;
      return;
    }

    if (customId.startsWith("game_")) {
      const [_, user1, user2, index] = customId.split("_");
      const game = gameState[createGameKey(user1, user2)];

      if (!game) {
        return interaction.reply({
          content: "This game doesn't exist.",
          ephemeral: true,
        });
      }

      if (![game.player1, game.player2].includes(user.id)) {
        return interaction.reply({
          content: "This is not your game!",
          ephemeral: true,
        });
      }

      if (user.id !== game.currentTurn) {
        return interaction.reply({
          content: `It's not your turn! Wait for <@${game.currentTurn}>.`,
          ephemeral: true,
        });
      }

      if (game.board[index] !== null) {
        return interaction.reply({
          content: "This spot is already taken!",
          ephemeral: true,
        });
      }

      await interaction.deferUpdate();

      const playerMark =
        user.id === game.player1 ? PLAYER_MARKS.player1 : PLAYER_MARKS.player2;
      game.board[index] = playerMark;
      game.currentTurn =
        game.currentTurn === game.player1 ? game.player2 : game.player1;

      const winningCombination = checkWin(game.board);
      const isTie = !game.board.includes(null);

      const updatedRows = renderGameBoard(
        game,
        user1,
        user2,
        winningCombination,
        isTie
      );

      if (!winningCombination && !isTie) {
        updatedRows.push(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`end_game_${user1}_${user2}`)
              .setLabel("End Game")
              .setStyle(ButtonStyle.Danger)
          )
        );
      }

      const gameMessageContent = winningCombination
        ? `🎉 <@${user.id}> won the game! 🎉`
        : isTie
        ? "It's a tie!"
        : `It's <@${game.currentTurn}>'s turn!`;

      await interaction.message.edit({
        content: gameMessageContent,
        components: updatedRows,
      });

      if (winningCombination || isTie) {
        delete gameState[createGameKey(user1, user2)];
      }

      return;
    }

    if (customId.startsWith("end_game_")) {
      const [, , user1, user2] = customId.split("_");
      const game = gameState[createGameKey(user1, user2)];

      if (!game) {
        return interaction.reply({
          content: "This game doesn't exist.",
          ephemeral: true,
        });
      }

      await endGame(interaction, user1, user2, game);
    }
  },
};

function checkWin(board) {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return true;
    }
  }
  return false;
}

async function endGame(interaction, user1, user2, game) {
  const updatedRows = [];
  for (let i = 0; i < 3; i++) {
    updatedRows.push(
      new ActionRowBuilder().addComponents(
        game.board.slice(i * 3, i * 3 + 3).map((label, idx) => {
          return new ButtonBuilder()
            .setCustomId(`game_${user1}_${user2}_${i * 3 + idx}`)
            .setLabel(label || "ㅤㅤ")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
        })
      )
    );
  }

  await interaction.message.edit({
    content: `<@${interaction.user.id}> aborted the game.`,
    components: updatedRows,
  });

  delete gameState[createGameKey(user1, user2)];
  await interaction.reply({ content: "Game aborted!", ephemeral: true });
}

function renderGameBoard(game, user1, user2, winningCombination, isTie) {
  const updatedRows = [];
  for (let i = 0; i < 3; i++) {
    updatedRows.push(
      new ActionRowBuilder().addComponents(
        game.board.slice(i * 3, i * 3 + 3).map((label, idx) => {
          return new ButtonBuilder()
            .setCustomId(`game_${user1}_${user2}_${i * 3 + idx}`)
            .setLabel(label || "ㅤㅤ")
            .setStyle(
              label !== null || winningCombination || isTie
                ? ButtonStyle.Secondary
                : ButtonStyle.Primary
            )
            .setDisabled(label !== null || winningCombination || isTie);
        })
      )
    );
  }
  return updatedRows;
}

function createGameKey(user1, user2) {
  return `${user1}_${user2}`;
}

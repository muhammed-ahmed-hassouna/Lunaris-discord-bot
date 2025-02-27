const gameManager = require("../game/GameManager");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("جواب")
    .setDescription("الإجابة على السؤال")
    .addStringOption((option) =>
      option
        .setName("الإجابة")
        .setDescription("الإجابة (نعم/لا)")
        .setRequired(true)
        .addChoices(
          { name: "نعم", value: "نعم" },
          { name: "لا", value: "لا" },
          { name: "Yes", value: "yes" },
          { name: "No", value: "no" }
        )
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const game = client.activeGames.get(interaction.channel.id);
    if (!game) {
      return interaction.editReply({
        content: "❌ لا توجد لعبة نشطة هنا",
      });
    }

    // Identify expected responder (should be current turn)
    const expectedResponder = game.players.find(
      (p) => p.id === game.currentTurn
    );
    
    if (!expectedResponder) {
      return interaction.editReply({
        content: "❌ حدث خطأ، لا يوجد لاعب للرد على السؤال!",
      });
    }

    // Verify responder identity
    if (interaction.user.id !== expectedResponder.id) {
      return interaction.editReply({
        content: `❌ فقط <@${expectedResponder.id}> يمكنه الإجابة على السؤال الحالي!`,
      });
    }

    // Get and convert answer
    const answer = interaction.options.getString("الإجابة");
    const arabicAnswer = ["yes", "نعم"].includes(answer) ? "نعم" : "لا";

    // CORRECTED: Keep turn with the responder to allow them to act
    game.currentTurn = interaction.user.id;

    // Get member references
    const currentMember = await interaction.guild.members.fetch(interaction.user.id);
    const nextTurnMember = await interaction.guild.members.fetch(game.currentTurn);

    // Announce outcome
    await interaction.channel.send(
      `✅ <@${currentMember.id}> أجاب: **${arabicAnswer}**\n` +
      `🔄 استمرار دور <@${nextTurnMember.id}>:\n` +
      `• طرح سؤال جديد (/سؤال)\n` +
      `• تخمين الإجابة (/تخمين)`
    );

    // Log action
    await gameManager.logAction(
      client,
      game.id,
      `✅ **${currentMember.displayName}** أجاب: "${arabicAnswer}"\n` +
      `🔄 استمرار دور **${nextTurnMember.displayName}**`
    );

    await interaction.editReply({
      content: "✅ تمت الإجابة بنجاح",
    });
  },
};

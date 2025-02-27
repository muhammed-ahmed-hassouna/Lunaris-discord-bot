const gameManager = require("../game/GameManager");
const { validateGuess } = require("../utils/openaiValidator");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("تخمين")
    .setDescription("قم بتخمين الإجابة خلال دورك")
    .addStringOption((option) =>
      option.setName("الإجابة").setDescription("تخمينك").setRequired(true)
    ),
  async execute(interaction, client) {
    try {
      const game = client.activeGames.get(interaction.channel.id);
      const guess = interaction.options.getString("الإجابة");

      if (!game) {
        return await interaction.reply({
          content: "\u200F" + "لا توجد لعبة نشطة هنا",
        });
      }

      if (game.currentTurn !== interaction.user.id) {
        return await interaction.reply({
          content: "\u200F" + `انتظر دورك! الآن دور <@${game.currentTurn}>`,
        });
      }

      await interaction.deferReply();
      const correctAnswer = game.images[interaction.user.id].title;

      if (!guess) {
        return await interaction.editReply({
          content: "\u200F" + "الرجاء كتابة تخمينك",
        });
      }

      const { isValid, reasoning, rawResponse } = await validateGuess(
        guess,
        correctAnswer
      );

      // Log the AI analysis
      await gameManager.logAction(
        client,
        game.id,
        "\u200F" + `🤖 **تحليل الذكاء الاصطناعي**\n` +
          `التخمين: "${guess}"\n` +
          `الإجابة الصحيحة: "${correctAnswer}"\n` +
          `القرار النهائي: ${isValid ? "✅ مقبول" : "❌ مرفوض"}\n` +
          `الرد الكامل: \`\`\`${rawResponse}\`\`\``
      );

      if (isValid) {
        await interaction.editReply(
          "\u200F" + `🎉 إجابة صحيحة! <@${interaction.user.id}> فاز! الإجابة كانت "${correctAnswer}"`
        );
        
        await gameManager.logAction(
          client,
          game.id,
          "\u200F" + `🎯 **${interaction.user.tag}** خمن: "${guess}"\n✅ إجابة صحيحة!`
        );
        
        await gameManager.endGame(client, game, interaction.channel.id);
        client.activeGames.delete(interaction.channel.id);
      } else {
        const nextTurn = game.players.find(
          (p) => p.id !== interaction.user.id
        ).id;
        game.currentTurn = nextTurn;
        
        await interaction.editReply(
          "\u200F" + `❌ تخمين خاطئ، <@${interaction.user.id}>! ` +
            `دور <@${game.currentTurn}> للقيام بـ:\n` +
            `• طرح سؤال جديد\n` +
            `• تخمين الإجابة`
        );
        
        await gameManager.logAction(
          client,
          game.id,
          "\u200F" + `🎯 **${interaction.user.tag}** خمن: "${guess}"\n❌ إجابة خاطئة!`
        );
      }
    } catch (error) {
      // If we haven't replied yet, reply with error
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "\u200F" + "حدث خطأ غير متوقع أثناء معالجة التخمين",
          ephemeral: true
        });
      } else {
        // If we have deferred, edit the reply
        await interaction.editReply({
          content: "\u200F" + "حدث خطأ غير متوقع أثناء معالجة التخمين"
        });
      }
      console.error("Error in guess command:", error);
    }
  },
};
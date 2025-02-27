const gameManager = require("../game/GameManager");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js"); // Added EmbedBuilder

module.exports = {
  data: new SlashCommandBuilder()
    .setName("سؤال")
    .setDescription("اطرح سؤالاً خلال دورك")
    .addStringOption((option) =>
      option
        .setName("السؤال")
        .setDescription("السؤال الذي تريد طرحه")
        .setRequired(true)
    ),
  async execute(interaction, client) {
    await interaction.deferReply();

    try {
      const game = client.activeGames.get(interaction.channel.id);

      if (!game) {
        return interaction.editReply({
          content: "\u200F" + "❌ لا توجد لعبة نشطة هنا",
        });
      }

      if (game.currentTurn !== interaction.user.id) {
        return interaction.editReply({
          content: "\u200F" + `❌ دور <@${game.currentTurn}> لطرح السؤال`,
        });
      }

      const question = interaction.options.getString("السؤال");
      if (!question) {
        return interaction.editReply({
          content: "\u200F" + "❌ الرجاء كتابة السؤال",
        });
      }

      const opponent = game.players.find((p) => p.id !== interaction.user.id);

      // Create embed message
      const questionEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setDescription(
          `\u200F❓ <@${interaction.user.id}> يسأل: "${question}"\n\n` +
            `💬 أجب باستخدام الأمر \`/جواب نعم/لا\``
        );

      // Send the embed in the channel and mention the opponent
      await interaction.channel.send({
        content: `\u200F<@${opponent.id}>`,
        embeds: [questionEmbed],
      });

      game.currentTurn = opponent.id;

      // Confirm question was posted
      await interaction.editReply({
        content: "\u200F✅ تم نشر السؤال في القناة",
      });

      // Log the action
      const currentMember = await interaction.guild.members.fetch(
        interaction.user.id
      );
      await gameManager.logAction(
        client,
        game.id,
        "\u200F" + `❓ **<@${currentMember.id}>** سأل: "${question}"\n`
      );
    } catch (error) {
      console.error("Error in ask command:", error);
      await interaction.editReply({
        content: "\u200F" + "❌ حدث خطأ غير متوقع أثناء معالجة السؤال",
      });
    }
  },
};

const { SlashCommandBuilder } = require("discord.js");
const gameManager = require("../game/GameManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("انهاء")
    .setDescription("انهاء اللعبة الحالية (للأدمن فقط) لاتسوي خوي"),
  async execute(interaction, client) {
    await interaction.deferReply({  });

    // Admin check
    if (!interaction.member.roles.cache.some((r) => r.name === "Admin")) {
      return interaction.editReply({
        content: "دزمها مسوي خوي ادمن",
        
      });
    }

    const game = client.activeGames.get(interaction.channel.id);
    if (!game) {
      return interaction.editReply({
        content: "ما في لعبة نشطة هنا",
        
      });
    }

    try {
      // End game
      await gameManager.endGame(client, game, interaction.channel.id);

      // Public announcement
      await interaction.channel.send("تم إنهاء اللعبة بواسطة الأدمن");
      await interaction.editReply({
        content: "تم إنهاء اللعبة بنجاح",
        
      });
    } catch (error) {
      console.error("Error ending game:", error);
      await interaction.editReply({
        content: "حدث خطأ أثناء محاولة إنهاء اللعبة",
        
      });
    }
  },
};

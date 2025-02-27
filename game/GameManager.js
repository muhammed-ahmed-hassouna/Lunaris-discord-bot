const { PermissionsBitField } = require("discord.js");
const { v4: uuidv4 } = require("uuid");

class GameManager {
  constructor() {
    this.activeGames = new Map();
    this.gameHistory = [];
  }

  async logAction(client, gameId, content) {
    const game = this.activeGames.get(gameId);
    if (!game || !game.viewersChannelId) return;

    const channel = client.channels.cache.get(game.viewersChannelId);
    if (!channel) return;

    await channel.send({
      embeds: [
        {
          color: 0x7289da,
          description: content,
          fields: content.includes("🤖 **AI Validation**")
            ? [
                {
                  name: "معلومات تصحيح الأخطاء",
                  value: `معرف الطلب: ${Math.random()
                    .toString(36)
                    .slice(2, 9)}`,
                },
              ]
            : [],
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }
  catch(error) {
    console.error("خطأ في التسجيل:", error);
  }

  /**
   * بدء جلسة لعبة جديدة
   * @param {GameSession} game
   */
  initGame(game) {
    game.id = uuidv4();
    game.startTime = Date.now();
    this.activeGames.set(game.id, game);
    return game;
  }

  /**
   * التعامل مع فشل بدء اللعبة
   * @param {Client} client
   * @param {GameSession} game
   * @param {string} channelId
   */
  async cleanupFailedGame(client, game, channelId) {
    try {
      // تنظيف قناة المشاهدين
      const viewersChannel = client.channels.cache.get(game.viewersChannelId);
      if (viewersChannel) {
        await viewersChannel.delete().catch(console.error);
      }

      // إزالة من التتبع
      client.activeGames.delete(channelId);
      this.activeGames.delete(game.id);
    } catch (error) {
      console.error("خطأ في تنظيف اللعبة الفاشلة:", error);
    }
  }

  /**
   * إنهاء جلسة اللعبة بشكل صحيح
   * @param {Client} client
   * @param {GameSession} game
   * @param {string} channelId
   */
  async endGame(client, game, channelId) {
    try {
      const viewersChannel = client.channels.cache.get(game.viewersChannelId);

      // تحديث أذونات قناة المشاهدين
      if (viewersChannel) {
        await Promise.all([
          viewersChannel.permissionOverwrites.edit(game.players[0].id, {
            ViewChannel: true,
          }),
          viewersChannel.permissionOverwrites.edit(game.players[1].id, {
            ViewChannel: true,
          }),
          viewersChannel.permissionOverwrites.edit(client.user.id, {
            ViewChannel: true,
          }),
        ]);

        await viewersChannel.send({
          embeds: [
            {
              color: game.winner ? 0x00ff00 : 0xff0000,
              title: game.winner
                ? `🏆 فوز - ${game.winner.tag}`
                : "انتهت اللعبة",
              fields: [
                { name: "اللاعب 1", value: game.players[0].tag, inline: true },
                { name: "اللاعب 2", value: game.players[1].tag, inline: true },
                {
                  name: "المدة",
                  value: `${Math.floor(
                    (game.endTime - game.startTime) / 1000
                  )} ثانية`,
                },
              ],
              image: { url: game.winner?.displayAvatarURL() },
            },
          ],
        });
      }

      // أرشفة بيانات اللعبة
      game.endTime = Date.now();
      this.gameHistory.push(game);
      this.activeGames.delete(game.id);
      client.activeGames.delete(channelId);

      // حذف القناة بشكل اختياري بعد فترة
      // if (viewersChannel) {
      //   setTimeout(async () => {
      //     await viewersChannel.delete().catch(console.error);
      //   }, 3600000); // 1 ساعة
      // }
    } catch (error) {
      console.error("خطأ في إنهاء اللعبة:", error);
    }
  }

  /**
   * استرجاع اللعبة باستخدام المعرف
   * @param {string} gameId
   * @returns {GameSession|null}
   */
  getGame(gameId) {
    return this.activeGames.get(gameId) || null;
  }

  /**
   * الحصول على إحصائيات اللعبة
   * @param {string} gameId
   * @returns {Object}
   */
  getGameStats(gameId) {
    const game = this.getGame(gameId);
    if (!game) return null;

    return {
      duration: game.endTime
        ? game.endTime - game.startTime
        : Date.now() - game.startTime,
      players: game.players.map((p) => p.id),
      moveCount: game.moveHistory?.length || 0,
      winner: game.winner,
    };
  }
}

module.exports = new GameManager();

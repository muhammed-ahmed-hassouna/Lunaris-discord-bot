const { getRandomImagePair } = require("../utils/imageManager");
const GameSession = require("../game/GameSession");
const gameManager = require("../game/GameManager");
const {
  PermissionsBitField,
  ChannelType,
  SlashCommandBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ابدأ")
    .setDescription("بدء لعبة جديدة بين لاعبين")
    .addUserOption((option) =>
      option.setName("player1").setDescription("اللاعب الأول").setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("player2")
        .setDescription("اللاعب الثاني")
        .setRequired(true)
    ),
  async execute(interaction, client) {
    await interaction.deferReply({});

    // Admin check
    if (!interaction.member.roles.cache.some((r) => r.name === "Admin")) {
      return interaction.editReply("دزمها مسوي خوي ادمن");
    }

    const player1 = interaction.options.getUser("player1");
    const player2 = interaction.options.getUser("player2");

    if (client.activeGames.has(interaction.channel.id)) {
      return interaction.editReply({
        content: "❗ يوجد لعبة نشطة بالفعل في هذه القناة",
      });
    }

    // Channel name creation logic
    const player1Lower = player1.username
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "");
    const player2Lower = player2.username
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "");

    // Refresh channel cache using interaction.guild instead of message.guild
    await interaction.guild.channels.fetch();

    // Check both possible player order combinations
    const existingChannel = interaction.guild.channels.cache.find((channel) => {
      const chanName = channel.name.toLowerCase().replace(/[^a-z0-9-_]/g, "");
      return (
        chanName.startsWith(`viewers-${player1Lower}-vs-${player2Lower}`) ||
        chanName.startsWith(`viewers-${player2Lower}-vs-${player1Lower}`)
      );
    });

    const sortedName = [player1Lower, player2Lower].sort().join("-vs-");

    let viewersChannel;

    if (existingChannel) {
      viewersChannel = existingChannel;
      const messages = await viewersChannel.messages.fetch({ limit: 100 });
      await viewersChannel.bulkDelete(messages);

      await Promise.all([
        viewersChannel.permissionOverwrites.edit(player1.id, {
          ViewChannel: false,
        }),
        viewersChannel.permissionOverwrites.edit(player2.id, {
          ViewChannel: false,
        }),
        viewersChannel.permissionOverwrites.edit(interaction.guild.id, {
          ViewChannel: true,
        }),
        viewersChannel.permissionOverwrites.edit(client.user.id, {
          ViewChannel: true,
        }),
      ]);
    } else {
      viewersChannel = await interaction.guild.channels.create({
        name: `viewers-${sortedName}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: player1.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: player2.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: client.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });
    }

    const imagePair = await getRandomImagePair();
    const game = new GameSession(player1, player2, imagePair);
    game.viewersChannelId = viewersChannel.id;
    client.activeGames.set(interaction.channel.id, game);

    // Initialize game in manager
    await gameManager.initGame(game);

    try {
      if (!imagePair || imagePair.length < 2) {
        await gameManager.cleanupFailedGame(
          client,
          game,
          interaction.channel.id
        );
        return interaction.editReply("فشل في جلب الصور. حاول مرة أخرى لاحقاً.");
      }

      const player1Embed = {
        embeds: [
          {
            title: "صورة خصمك",
            image: {
              url: imagePair[1].url,
            },
            description: imagePair[1].title,
          },
        ],
      };

      const player2Embed = {
        embeds: [
          {
            title: "صورة خصمك",
            image: {
              url: imagePair[0].url,
            },
            description: imagePair[0].title,
          },
        ],
      };

      // Send the embedded image to players
      await player1.send(player1Embed);
      await player2.send(player2Embed);
    } catch (err) {
      await gameManager.cleanupFailedGame(client, game, interaction.channel.id);
      console.log(err);
      return interaction.editReply(
        "فشل في بدء اللعبة - تعذر إرسال رسائل خاصة للاعبين"
      );
    }

    // Send initial info to viewers channel
    const viewersChannelObj = client.channels.cache.get(viewersChannel.id);
    await viewersChannelObj.send(
      `🎮 بدأت اللعبة!\n**اللاعبون:**\n- ${player1.tag}\n- ${player2.tag}\n` +
        `**وقت البدء:** ${new Date().toLocaleString("ar-SA")}\n\n` +
        `*سيتم تسجيل جميع إجراءات اللعبة هنا*`
    );

    await interaction.editReply(
      `بدأت اللعبة بين ${player1} و ${player2}!\n` +
        `دور <@${game.currentTurn}> للبدء. استخدم سؤال للبدء.\n\n` +
        `يمكن للمشاهدين متابعة اللعبة في ${viewersChannel}\n`
    );

    // Send the images to viewers
    await viewersChannel.send({
      content: `🕹️ بدأت اللعبة!\nلا يمكن للاعبين رؤية هذه القناة حالياً.`,
      embeds: [
        {
          title: `صورة ${player1.username}`,
          image: { url: imagePair[0].url },
          description: imagePair[0].title,
        },
        {
          title: `صورة ${player2.username}`,
          image: { url: imagePair[1].url },
          description: imagePair[1].title,
        },
      ],
    });

    // Set timeout to delete channel after 30 minutes
    setTimeout(async () => {
      try {
        await viewersChannel.delete();
        console.log(
          `تم حذف قناة المشاهدين ${viewersChannel.name} بعد 30 دقيقة.`
        );
      } catch (err) {
        console.error("خطأ في حذف قناة المشاهدين:", err);
      }
    }, 30 * 60 * 1000); // 30 minutes in milliseconds
  },
};

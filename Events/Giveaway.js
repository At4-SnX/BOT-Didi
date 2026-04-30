const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const giveaways = require("../../utils/giveawayStore");

module.exports = {
  name: "giveaway",

  async execute(message, args) {

    const duration = parseInt(args[0]);
    const prize = args.slice(1).join(" ");

    if (!duration || !prize) {
      return message.reply("Utilisation : n.giveaway <minutes> <récompense>");
    }

    const endTime = Date.now() + duration * 60000;

    const embed = new EmbedBuilder()
      .setColor(0x6a5acd)
      .setTitle("🎁 Giveaway Nancy RP")
      .setDescription(
        `🎉 **Récompense :** ${prize}\n\n` +
        `⏱️ Fin : <t:${Math.floor(endTime / 1000)}:R>\n` +
        `👥 Participants : **0**`
      )
      .setFooter({ text: "🌺 Nancy RP • Giveaway" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("join_giveaway")
        .setLabel("Participer 🎉")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("list_giveaway")
        .setLabel("Participants 📋")
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.channel.send({
      embeds: [embed],
      components: [row]
    });

    giveaways.set(msg.id, {
      prize,
      participants: [],
      endTime,
      message: msg
    });

    // ⏱️ UPDATE LIVE
    const interval = setInterval(async () => {
      const data = giveaways.get(msg.id);
      if (!data) return clearInterval(interval);

      const updatedEmbed = EmbedBuilder.from(msg.embeds[0]).setDescription(
        `🎉 **Récompense :** ${prize}\n\n` +
        `⏱️ Fin : <t:${Math.floor(endTime / 1000)}:R>\n` +
        `👥 Participants : **${data.participants.length}**`
      );

      await msg.edit({ embeds: [updatedEmbed] }).catch(() => {});
    }, 5000);

    // 🎉 FIN GIVEAWAY
    setTimeout(async () => {
      clearInterval(interval);

      const data = giveaways.get(msg.id);
      if (!data) return;

      if (!data.participants.length) {
        return message.channel.send("❌ Aucun participant.");
      }

      const winner =
        data.participants[Math.floor(Math.random() * data.participants.length)];

      // 🎉 ANIMATION
      const finalEmbed = new EmbedBuilder()
        .setColor(0x00ffcc)
        .setTitle("🎉 GIVEAWAY TERMINÉ")
        .setDescription(
          `🏆 Gagnant : <@${winner}>\n🎁 **${prize}**`
        )
        .setFooter({ text: "🌺 Nancy RP • Félicitations !" })
        .setTimestamp();

      await msg.edit({
        embeds: [finalEmbed],
        components: []
      });

      message.channel.send(
        `🎊✨ Félicitations <@${winner}> ! Tu remportes **${prize}** ! 🎉`
      );

      giveaways.delete(msg.id);

    }, duration * 60000);
  }
};
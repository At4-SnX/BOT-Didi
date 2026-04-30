const { EmbedBuilder } = require("discord.js");

const INVITE_LINK = "https://discord.gg/MKZuKJ7Gar"; // 🔥 A REMPLACER

module.exports = {
  async activate(guild, client, auto = false) {

    const everyone = guild.roles.everyone;

    // 🔒 lock salons
    guild.channels.cache.forEach(channel => {
      if (!channel.isTextBased()) return;

      channel.permissionOverwrites.edit(everyone, {
        SendMessages: false
      }).catch(() => {});
    });

    // 📢 annonce
    const announce = guild.channels.cache.get("1472639290163859638");

    if (announce) {
      const embed = new EmbedBuilder()
        .setColor(0x6a5acd)
        .setTitle("🚨 RAID MODE ACTIVÉ")
        .setDescription(
          auto
            ? "🧠 Détection automatique d’un raid.\nSécurité activée."
            : "Raid activé manuellement."
        )
        .setFooter({ text: "🌺 Nancy RP • Security core" })
        .setTimestamp();

      announce.send({ embeds: [embed] });
    }

    // 📩 DM ALL
    const members = await guild.members.fetch();

    members.forEach(m => {
      if (m.user.bot) return;

      m.send(
        `🚨 **Raid détecté sur le serveur !**\n\n` +
        `Si tu es expulsé, tu peux revenir ici :\n${INVITE_LINK}`
      ).catch(() => {});
    });
  }
};
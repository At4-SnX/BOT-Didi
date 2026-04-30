const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "help",

  async execute(message) {

    const embed = new EmbedBuilder()
      .setColor(0x6a5acd)
      .setTitle("💠 Nancy RP • Aide du Bot")
      .setDescription("Voici toutes les commandes disponibles :\n")
      .addFields(

        {
          name: "🔐 Sécurité",
          value:
            "`n.raid` → Activer raid mode\n" +
            "`n.unraid` → Désactiver raid mode\n" +
            "`n.raidsim` → Simulation raid\n" +
            "`n.antibot on/off` → Anti-bot",
          inline: false
        },

        {
          name: "⚠️ Modération",
          value:
            "`n.warn @user raison` → Warn\n" +
            "`n.warns @user` → Voir warns\n" +
            "`n.panel` → Panel staff V2",
          inline: false
        },

        {
          name: "🎁 Giveaway",
          value:
            "`n.giveaway <temps> <récompense>` → Créer un giveaway",
          inline: false
        },

        {
          name: "🧠 Système",
          value:
            "`n.save` → Sauvegarde serveur\n" +
            "`n.load` → Charger sauvegarde",
          inline: false
        },

        {
          name: "💡 Info",
          value:
            "`n.help` → Afficher cette aide",
          inline: false
        }

      )
      .setFooter({ text: "🌺 Nancy RP • Security core" })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
};
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

module.exports = {
  name: "panel",

  async execute(message) {

    if (!message.member.permissions.has("ModerateMembers")) {
      return message.reply("❌ Permission refusée.");
    }

    const embed = new EmbedBuilder()
      .setColor(0x6a5acd)
      .setTitle("🎛️ Panel Staff V2")
      .setDescription("Sélectionne une action de modération")
      .setFooter({ text: "🌺 Nancy RP • Security core" });

    const menu = new StringSelectMenuBuilder()
      .setCustomId("panel_action")
      .setPlaceholder("Choisir une action")
      .addOptions([
        { label: "Warn", value: "warn", emoji: "⚠️" },
        { label: "Kick", value: "kick", emoji: "👢" },
        { label: "Ban", value: "ban", emoji: "🔨" },
        { label: "Mute", value: "mute", emoji: "🔇" }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    message.channel.send({ embeds: [embed], components: [row] });
  }
};
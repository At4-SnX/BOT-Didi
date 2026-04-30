const { EmbedBuilder } = require("discord.js");

function premiumEmbed({ title, description, color = 0x5865f2 }) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`💠 ${title}`)
    .setDescription(description)
    .setFooter({ text: "🌺 Nancy RP • Security Core" })
    .setTimestamp();
}

module.exports = { premiumEmbed };
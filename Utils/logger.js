const { EmbedBuilder } = require("discord.js");

const LOG_CHANNEL_ID = "1499125248191103066";

async function sendLog(guild, {
  title = "📊 Log",
  description = "Aucune information",
  color = 0x6a5acd,
  fields = [],
  thumbnail = null
}) {

  try {
    const channel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(description)
      .setFooter({ text: "🌺 Nancy RP • Security core" })
      .setTimestamp();

    if (fields.length) embed.addFields(fields);
    if (thumbnail) embed.setThumbnail(thumbnail);

    await channel.send({ embeds: [embed] });

  } catch (err) {
    console.error("Erreur log :", err);
  }
}

// ================== LOGS ==================

function logWarn(guild, member, moderator, reason, level) {
  sendLog(guild, {
    title: "⚠️ Warn",
    description: `${member}`,
    fields: [
      { name: "👤 Staff", value: `<@${moderator.id}>`, inline: true },
      { name: "📌 Raison", value: reason, inline: true },
      { name: "📊 Niveau", value: `${level}/3`, inline: true }
    ],
    thumbnail: member.user.displayAvatarURL()
  });
}

function logKick(guild, member, moderator, reason = "Aucune") {
  sendLog(guild, {
    title: "👢 Kick",
    description: `${member.user.tag}`,
    fields: [
      { name: "👤 Staff", value: moderator ? `<@${moderator.id}>` : "Auto", inline: true },
      { name: "📌 Raison", value: reason, inline: true }
    ],
    thumbnail: member.user.displayAvatarURL()
  });
}

function logBan(guild, user, moderator, reason = "Aucune") {
  sendLog(guild, {
    title: "🔨 Ban",
    description: `${user.tag}`,
    fields: [
      { name: "👤 Staff", value: moderator ? `<@${moderator.id}>` : "Auto", inline: true },
      { name: "📌 Raison", value: reason, inline: true }
    ],
    thumbnail: user.displayAvatarURL()
  });
}

function logRaid(guild) {
  sendLog(guild, {
    title: "🚨 RAID MODE",
    description: "Activation du raid mode",
    color: 0xff0000
  });
}

module.exports = {
  sendLog,
  logWarn,
  logKick,
  logBan,
  logRaid
};
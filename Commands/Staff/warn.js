const { premiumEmbed } = require("../../utils/embed");
const { addWarn } = require("../../utils/warnSystem");

const WARN_ROLES = [
  "1472675083339169813",
  "1472675086741012637",
  "1472675097771774104"
];

module.exports = {
  name: "warn",

  async execute(message, args) {
    const member = message.mentions.members.first();
    if (!member) return message.reply("Mention un utilisateur.");

    const reason = args.slice(1).join(" ") || "Aucune raison";

    let count = WARN_ROLES.filter(r => member.roles.cache.has(r)).length;

    if (count >= 3) {
      return message.reply("❌ Cet utilisateur a déjà 3 warns.");
    }

    await member.roles.add(WARN_ROLES[count]);

    addWarn(member.id, {
      reason,
      author: message.author.id,
      date: new Date().toISOString()
    });

    // ✅ AUTO MUTE ICI (correct)
    if (count + 1 === 3) {
      await member.timeout(10 * 60 * 1000).catch(() => {});
    }

    message.reply({
      embeds: [
        premiumEmbed({
          title: "⚠️ Warn ajouté",
          description:
            `${member}\nRaison : **${reason}**\nNiveau : ${count + 1}/3`
        })
      ]
    });
  }
};

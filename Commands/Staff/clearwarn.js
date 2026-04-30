const { premiumEmbed } = require("../../utils/embed");
const { clearWarns } = require("../../utils/warnSystem");

const WARN_ROLES = [
  "1472675083339169813",
  "1472675086741012637",
  "1472675097771774104"
];

module.exports = {
  name: "clearwarn",

  async execute(message, args) {
    const member = message.mentions.members.first();
    if (!member) return message.reply("Mention un utilisateur.");

    // enlever rôles
    for (const role of WARN_ROLES) {
      if (member.roles.cache.has(role)) {
        await member.roles.remove(role).catch(() => {});
      }
    }

    clearWarns(member.id);

    message.reply({
      embeds: [
        premiumEmbed({
          title: "✅ Warns reset",
          description: `${member} n'a plus aucun warn`
        })
      ]
    });
  }
};
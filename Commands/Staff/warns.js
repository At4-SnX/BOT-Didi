const { premiumEmbed } = require("../../utils/embed");
const { getWarns } = require("../../utils/warnSystem");

module.exports = {
  name: "warns",

  async execute(message) {
    const member = message.mentions.members.first();
    if (!member) return message.reply("Mention un utilisateur.");

    const data = getWarns(member.id);

    if (!data.length) {
      return message.reply("Aucun warn.");
    }

    const desc = data
      .map((w, i) =>
        `**${i + 1}.** ${w.reason}\n👤 <@${w.author}>`
      )
      .join("\n\n");

    message.reply({
      embeds: [
        premiumEmbed({
          title: `📊 Warns de ${member.user.tag}`,
          description: desc
        })
      ]
    });
  }
};
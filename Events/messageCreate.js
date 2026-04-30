const PREFIX = "n.";

module.exports = {
  name: "messageCreate",
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    const command = client.commands.get(cmdName);
    if (!command) return;

    try {
      command.execute(message, args, client);
    } catch (err) {
      console.error(err);
    }
  }
};

const spamMap = new Map();
const { logWarn } = require("../utils/logger");
const { addWarn } = require("../utils/warnSystem");

const WARN_ROLES = [
  "1472675083339169813",
  "1472675086741012637",
  "1472675097771774104"
];

module.exports = {
  name: "messageCreate",

  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const now = Date.now();
    const userData = spamMap.get(message.author.id) || {
      messages: [],
      warned: false
    };

    userData.messages.push(now);

    // garde seulement les 5 dernières secondes
    userData.messages = userData.messages.filter(t => now - t < 5000);

    // 🚨 SPAM DETECTÉ
    if (userData.messages.length >= 6) {

      // delete messages
      message.delete().catch(() => {});

      // évite spam sanction
      if (userData.warned) return;

      userData.warned = true;

      const member = message.member;

      let count = WARN_ROLES.filter(r => member.roles.cache.has(r)).length;

      if (count < 3) {
        await member.roles.add(WARN_ROLES[count]);

        addWarn(member.id, {
          reason: "Spam",
          author: "AutoMod",
          date: new Date().toISOString()
        });

        logWarn(message.guild, member, { id: "AutoMod" }, "Spam", count + 1);
      }

      // escalation
      if (count + 1 === 2) {
        await member.timeout(5 * 60 * 1000).catch(() => {});
      }

      if (count + 1 === 3) {
        await member.timeout(15 * 60 * 1000).catch(() => {});
      }

      message.channel.send(`🚫 ${member} spam détecté.`).then(m => {
        setTimeout(() => m.delete().catch(() => {}), 3000);
      });
    }

    spamMap.set(message.author.id, userData);
  }
};
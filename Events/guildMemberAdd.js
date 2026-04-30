const antiRaid = require("../utils/raidSystem");

const BOT_WHITELIST = []; // ajoute ici les bots autorisés

module.exports = {
  name: "guildMemberAdd",

  async execute(member, client) {

    // 🧠 Anti-raid (joins massifs)
    antiRaid(member, client);

    // 🤖 Anti-bot
    if (member.user.bot) {

      if (BOT_WHITELIST.includes(member.id)) return;
      if (member.id === client.user.id) return;

      await member.kick("🤖 Anti-bot activé").catch(() => {});
    }

  }
};

// 🧠 Compte trop récent
const accountAge = Date.now() - member.user.createdTimestamp;

if (accountAge < 1000 * 60 * 60 * 24) {
  await member.kick("Compte trop récent (anti-raid)").catch(() => {});
}

// 🧠 Compte trop récent
const accountAge = Date.now() - member.user.createdTimestamp;

if (accountAge < 1000 * 60 * 60 * 24) {
  await member.kick("Compte trop récent (anti-raid)").catch(() => {});
}
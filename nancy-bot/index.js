const Canvas = require("canvas");

// ======================================================
// 🟦 BLOC 1 — IMPORTS & CONFIG GLOBALE
// ======================================================

const fs = require("fs");
const ms = require("ms");
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require("discord.js");

// ======================================================
// 🟦 BLOC 2 — CLIENT DISCORD
// ======================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ======================================================
// 🟦 CONSTANTES GLOBALES (ADAPTÉES NANCY RP / SnX)
// ======================================================

// Proprio bot (si tu veux garder un override total)
const OWNER_ID = "1022469165824606258";

// 🔹 Rôles
const ROLE_MODERATION   = "1505943612507295826"; // Staff modération
const ROLE_RAID         = "1505943604164563064"; // Raid / antibot / snapshot
const ROLE_ANTIBOT      = "1505943604164563064";
const ROLE_SNAPSHOT     = "1505943604164563064";
const ROLE_GIVEAWAY     = "1506662161810981055";

// Pour la protection staff (mute/kick/ban)
const STAFF_ROLE_ID     = "1505943612507295826";

// 🔹 Rôles warns (si tu veux t’en servir plus tard)
const WARN_ROLE_1 = "1505943649882607686";
const WARN_ROLE_2 = "1505943650847162419";
const WARN_ROLE_3 = "1505943652361310319";

// 🔹 Salon logs global
const LOG_CHANNEL_ID = "1506771610143686776";

// 🔹 Giveaway (tu gardes aussi la fondation si tu veux)
const FOUNDATION_ROLE_ID = "1505943603204198400";

// 🔹 Anti-bot
const BOT_WHITELIST = ["1472637775281918123"]; // IDs bots autorisés

// 🔹 Couleurs embeds (thème bleu 0x237FEB)
const COLOR_MAIN    = 0x237feb;
const COLOR_SUCCESS = 0x2ecc71;
const COLOR_ERROR   = 0xe74c3c;
const COLOR_INFO    = 0x237feb;

// 🔹 Footer global personnalisé SnX
const FOOTER = { text: "🌺 Nancy RP • Security Core by SnX" };

// 🔹 Join / Leave (ADAPTÉ à tes nouveaux salons)
const JOIN_CHANNEL_ID  = "1505943697496346725";
const LEAVE_CHANNEL_ID = "1505943698582798427";
const NANCY_GIF = "https://cdn.discordapp.com/attachments/1472650661685624852/1495404641515606126/NANCY_RP_4.gif";

// 🔹 Tickets catégories (si tu gardes ce système)
const categories = {
  "1488678969472454846": "report_staff",
  "1488679203590373557": "unban",
  "1488681903006421172": "partenariat",
  "1488681966990528593": "autre",
  "1488683247998079006": "report_joueur"
};

// 🔹 États
const antiBotState = new Map();
const raidState    = new Map();

// 🔹 Snapshot serveur
let serverSnapshots = {};

// 🔹 Giveaways en mémoire (pour participants, temps restant, etc.)
const giveaways = new Map(); // key = messageId, value = { endTime, reward, participants: Set, image }

// ======================================================
// 🟦 CHARGEMENT DES WARNS
// ======================================================

let warns = {};
if (fs.existsSync("./warns.json")) {
  warns = JSON.parse(fs.readFileSync("./warns.json"));
} else {
  fs.writeFileSync("./warns.json", "{}");
}

// ======================================================
// 🟦 FONCTIONS UTILITAIRES (PERMS, LOGS, OUTILS SERVEUR)
// ======================================================

function isOwner(id) {
  return id === OWNER_ID;
}

function isMod(member) {
  return member.roles.cache.has(ROLE_MODERATION) || isOwner(member.id);
}

function isRaidManager(member) {
  return member.roles.cache.has(ROLE_RAID) || isOwner(member.id);
}

function isAntiBotManager(member) {
  return member.roles.cache.has(ROLE_ANTIBOT) || isOwner(member.id);
}

function isSnapshotManager(member) {
  return member.roles.cache.has(ROLE_SNAPSHOT) || isOwner(member.id);
}

function canUseGiveaway(member) {
  return (
    member.roles.cache.has(ROLE_GIVEAWAY) ||
    member.roles.cache.has(FOUNDATION_ROLE_ID) ||
    isOwner(member.id)
  );
}

// 🔹 Log centralisé
async function sendLog(guild, embed) {
  try {
    const channel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!channel) return;
    await channel.send({ embeds: [embed] });
  } catch (e) {
    console.error("Erreur envoi log :", e);
  }
}

// 🔹 Embeds de base
function baseEmbed(color = COLOR_MAIN) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter(FOOTER)
    .setTimestamp();
}

// 🔹 Lock / unlock serveur
async function lockChannels(guild) {
  const everyone = guild.roles.everyone;

  for (const [, channel] of guild.channels.cache) {
    if (!channel.isTextBased() && channel.type !== ChannelType.GuildCategory) continue;

    await channel.permissionOverwrites
      .edit(everyone, {
        SendMessages: false,
        AddReactions: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false
      })
      .catch(() => {});
  }
}

async function unlockChannels(guild) {
  const everyone = guild.roles.everyone;

  for (const [, channel] of guild.channels.cache) {
    if (!channel.isTextBased() && channel.type !== ChannelType.GuildCategory) continue;

    await channel.permissionOverwrites
      .edit(everyone, {
        SendMessages: null,
        AddReactions: null,
        CreatePublicThreads: null,
        CreatePrivateThreads: null
      })
      .catch(() => {});
  }
}

// 🔹 Kick bots non whitelist en raid
async function kickNonWhitelistedBots(guild) {
  const members = await guild.members.fetch();

  for (const [, member] of members) {
    if (member.user.bot && !BOT_WHITELIST.includes(member.id) && member.id !== client.user.id) {
      await member.kick("Raid Mode : bot non whitelist").catch(() => {});
    }
  }
}

// 🔹 Snapshot / restore
function snapshotServer(guild) {
  const data = { categories: [], channels: [] };

  guild.channels.cache.forEach((ch) => {
    if (ch.type === ChannelType.GuildCategory) {
      data.categories.push({
        id: ch.id,
        name: ch.name,
        position: ch.position
      });
    } else if (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildVoice) {
      data.channels.push({
        id: ch.id,
        name: ch.name,
        type: ch.type,
        parentId: ch.parentId,
        position: ch.position
      });
    }
  });

  return data;
}

async function restoreServer(guild, snapshot) {
  if (!snapshot) return;

  for (const cat of snapshot.categories) {
    if (!guild.channels.cache.has(cat.id)) {
      await guild.channels
        .create({
          name: cat.name,
          type: ChannelType.GuildCategory,
          position: cat.position
        })
        .catch(() => {});
    }
  }

  for (const ch of snapshot.channels) {
    const exists = guild.channels.cache.find(
      (c) => c.name === ch.name && c.type === ch.type && c.parentId === ch.parentId
    );

    if (!exists) {
      await guild.channels
        .create({
          name: ch.name,
          type: ch.type,
          parent: ch.parentId || null,
          position: ch.position
        })
        .catch(() => {});
    }
  }
}

// 🔹 Format durée
function formatDuration(msValue) {
  const totalSeconds = Math.floor(msValue / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${days}j ${hours}h ${minutes}m`;
}

// ======================================================
// 🟦 BLOC 3 — COMMANDES PREFIX (n.)
// ======================================================

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("n.")) return;

  const args = message.content.slice(2).trim().split(/ +/g);
  const cmd = args.shift()?.toLowerCase();
  const guild = message.guild;

  // Vérification permissions
  const member = message.member;

  // Fonction log
  const log = (txt) => {
    const embed = baseEmbed(COLOR_INFO)
      .setTitle("📘 Log — Commande Prefix")
      .setDescription(txt)
      .addFields({ name: "Exécuté par", value: `${message.author.tag}` });

    sendLog(guild, embed);
  };

  // ======================================================
  // n.help
  // ======================================================
  if (cmd === "help") {
    const embed = baseEmbed(COLOR_MAIN)
      .setTitle("📘 Aide — Commandes Prefix")
      .setDescription(
        [
          "🟦 **Commandes disponibles :**",
          "",
          "`n.help` — Affiche cette aide",
          "`n.panel` — Ouvre le panel staff",
          "",
          "🛡️ **Sécurité**",
          "`n.raid` — Active le Raid Mode",
          "`n.unraid` — Désactive le Raid Mode",
          "`n.lock` — Verrouille le serveur",
          "`n.unlock` — Déverrouille le serveur",
          "",
          "🧹 **Modération**",
          "`n.purge <nombre>` — Supprime des messages",
          "`n.slowmode <durée>` — Active un slowmode",
          "",
          "🎁 **Giveaway**",
          "`n.giveaway <minutes> <récompense>`",
          "",
          "🌺 *Nancy RP Security Core — by SnX*"
        ].join("\n")
      );

    message.channel.send({ embeds: [embed] });
    log("Commande `n.help` exécutée.");
    return;
  }

  // ======================================================
  // n.panel
  // ======================================================
  if (cmd === "panel") {
    if (!isMod(member)) {
      return message.reply("⛔ Tu n'as pas accès au panel staff.");
    }

    const embed = baseEmbed(COLOR_MAIN)
      .setTitle("🛠️ Panel Staff — SnX")
      .setDescription(
        "Bienvenue dans le panel staff.\n" +
        "Utilise les commandes prefix ou slash pour gérer la sécurité du serveur."
      );

    message.channel.send({ embeds: [embed] });
    log("Commande `n.panel` exécutée.");
    return;
  }

  // ======================================================
  // n.raid
  // ======================================================
  if (cmd === "raid") {
    if (!isRaidManager(member)) {
      return message.reply("⛔ Tu n'as pas la permission d'activer le Raid Mode.");
    }

    const embed = baseEmbed(COLOR_ERROR)
      .setTitle("⚠️ Confirmation RAID")
      .setDescription("Veux‑tu vraiment activer le RAID Mode, SnX ?");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_raid_prefix")
        .setLabel("Activer")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("cancel_raid_prefix")
        .setLabel("Annuler")
        .setStyle(ButtonStyle.Secondary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
    return;
  }

  // ======================================================
  // n.unraid
  // ======================================================
  if (cmd === "unraid") {
    if (!isRaidManager(member)) {
      return message.reply("⛔ Tu n'as pas la permission de désactiver le Raid Mode.");
    }

    raidState.set(guild.id, false);
    await unlockChannels(guild);

    const embed = baseEmbed(COLOR_SUCCESS)
      .setTitle("🟦 RAID MODE DÉSACTIVÉ")
      .setDescription("Le serveur est de nouveau accessible.");

    message.channel.send({ embeds: [embed] });
    log("Raid Mode désactivé via prefix.");
    return;
  }

  // ======================================================
  // n.lock
  // ======================================================
  if (cmd === "lock") {
    if (!isMod(member)) return message.reply("⛔ Permission refusée.");

    await lockChannels(guild);

    const embed = baseEmbed(COLOR_ERROR)
      .setTitle("🔒 Serveur verrouillé")
      .setDescription("Tous les salons ont été verrouillés.");

    message.channel.send({ embeds: [embed] });
    log("Serveur verrouillé via prefix.");
    return;
  }

  // ======================================================
  // n.unlock
  // ======================================================
  if (cmd === "unlock") {
    if (!isMod(member)) return message.reply("⛔ Permission refusée.");

    await unlockChannels(guild);

    const embed = baseEmbed(COLOR_SUCCESS)
      .setTitle("🔓 Serveur déverrouillé")
      .setDescription("Tous les salons sont accessibles.");

    message.channel.send({ embeds: [embed] });
    log("Serveur déverrouillé via prefix.");
    return;
  }

  // ======================================================
  // n.slowmode
  // ======================================================
  if (cmd === "slowmode") {
    if (!isMod(member)) return message.reply("⛔ Permission refusée.");

    const duration = args[0];
    if (!duration) return message.reply("⛔ Indique une durée. Exemple : `n.slowmode 10s`");

    const msValue = ms(duration);
    if (!msValue) return message.reply("⛔ Durée invalide.");

    await message.channel.setRateLimitPerUser(msValue / 1000);

    const embed = baseEmbed(COLOR_INFO)
      .setTitle("🐌 Slowmode activé")
      .setDescription(`Slowmode défini sur **${duration}**.`);

    message.channel.send({ embeds: [embed] });
    log(`Slowmode activé : ${duration}`);
    return;
  }

  // ======================================================
  // n.purge
  // ======================================================
  if (cmd === "purge") {
    if (!isMod(member)) return message.reply("⛔ Permission refusée.");

    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100)
      return message.reply("⛔ Indique un nombre entre 1 et 100.");

    await message.channel.bulkDelete(amount, true);

    const embed = baseEmbed(COLOR_SUCCESS)
      .setTitle("🧹 Purge effectuée")
      .setDescription(`**${amount}** messages supprimés.`);

    message.channel.send({ embeds: [embed] });
    log(`Purge de ${amount} messages.`);
    return;
  }

  // ======================================================
  // n.giveaway
  // ======================================================
  if (cmd === "giveaway") {
    if (!canUseGiveaway(member)) {
      return message.reply("⛔ Tu n'as pas la permission de lancer un giveaway.");
    }

    const minutes = parseInt(args[0]);
    const reward = args.slice(1).join(" ");

    if (!minutes || !reward) {
      return message.reply("⛔ Utilisation : `n.giveaway <minutes> <récompense>`");
    }

    const endTime = Date.now() + minutes * 60 * 1000;

    const embed = baseEmbed(COLOR_MAIN)
      .setTitle("🎁 Giveaway — SnX")
      .setDescription(
        `🎉 **${reward}**\n\n` +
        `⏳ Fin dans **${minutes} minutes**.\n` +
        `👥 Cliquez sur **Participer** pour rejoindre.`
      )
      .setTimestamp(endTime);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("join_giveaway")
        .setLabel("Participer")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("view_giveaway")
        .setLabel("Participants")
        .setStyle(ButtonStyle.Primary)
    );

    const msg = await message.channel.send({ embeds: [embed], components: [row] });

    giveaways.set(msg.id, {
      endTime,
      reward,
      participants: new Set(),
      image: null
    });

    log(`Giveaway lancé : ${reward} (${minutes} minutes)`);
    return;
  }
});

// ======================================================
// 🟦 BLOC 4 — GESTION DES BOUTONS (RAID, SIMULATION, GIVEAWAY)
// ======================================================

const ANNOUNCE_CHANNEL_ID = "1505943699748814878";

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const guild = interaction.guild;
  const member = interaction.member;
  const id = interaction.customId;

  // Fonction log
  const log = (txt) => {
    const embed = baseEmbed(COLOR_INFO)
      .setTitle("📘 Log — Bouton")
      .setDescription(txt)
      .addFields({ name: "Exécuté par", value: `${interaction.user.tag}` });

    sendLog(guild, embed);
  };

  // ======================================================
  // 🔥 CONFIRMATION RAID MODE
  // ======================================================
  if (id === "confirm_raid_prefix") {
    if (!isRaidManager(member)) {
      return interaction.reply({ content: "⛔ Permission refusée.", ephemeral: true });
    }

    // Activation du RAID
    raidState.set(guild.id, true);
    await lockChannels(guild);
    await kickNonWhitelistedBots(guild);

    // Récupération menace
    const threat = raidState.get(guild.id)?.threat || "Menace inconnue";

    // Message dans annonces
    const announce = guild.channels.cache.get(ANNOUNCE_CHANNEL_ID);
    if (announce) {
      const embed = baseEmbed(COLOR_ERROR)
        .setTitle("🚨 RAID MODE ACTIVÉ — Alerte Sécurité")
        .setDescription(
          "Le serveur est passé en **mode RAID**.\n\n" +
          "🔒 Tous les salons ont été verrouillés.\n" +
          "🛑 Les bots non autorisés ont été expulsés.\n\n" +
          `🕵️ **Menace identifiée :** *${threat}*\n\n` +
          "🌺 *Sécurité renforcée.*"
        )
        .setImage(NANCY_GIF);

      announce.send({ embeds: [embed] });
    }

    // Réponse bouton
    await interaction.update({
      embeds: [
        baseEmbed(COLOR_ERROR)
          .setTitle("🚨 RAID MODE ACTIVÉ")
          .setDescription("🔮 Salons verrouillés\n🛑 Bots expulsés\n🔵 Protection active")
      ],
      components: []
    });

    log(`Raid Mode activé. Menace : ${threat}`);
    return;
  }

  // ======================================================
  // ❌ ANNULATION RAID
  // ======================================================
  if (id === "cancel_raid_prefix") {
    await interaction.update({
      embeds: [
        baseEmbed(COLOR_INFO)
          .setTitle("Raid annulé")
          .setDescription("🟦 Le RAID Mode n’a pas été activé.")
      ],
      components: []
    });

    log("Raid annulé.");
    return;
  }

  // ======================================================
  // 🔥 RAID SIMULATION (Bouton)
// ======================================================
  if (id === "simulate_raid") {
    if (!isRaidManager(member)) {
      return interaction.reply({ content: "⛔ Permission refusée.", ephemeral: true });
    }

    const embed = baseEmbed(COLOR_ERROR)
      .setTitle("🚨 SIMULATION RAID — SnX")
      .setDescription(
        "Ceci est **une simulation**.\n" +
        "Aucune action réelle n’a été effectuée.\n\n" +
        "🎯 *Utilisé pour tester la réactivité du staff.*"
      )
      .setImage(NANCY_GIF);

    await interaction.reply({ embeds: [embed] });
    log("Simulation RAID exécutée.");
    return;
  }

  // ======================================================
  // 🎁 GIVEAWAY — PARTICIPER
  // ======================================================
  if (id === "join_giveaway") {
    const data = giveaways.get(interaction.message.id);
    if (!data) {
      return interaction.reply({ content: "❌ Giveaway introuvable.", ephemeral: true });
    }

    if (data.participants.has(interaction.user.id)) {
      data.participants.delete(interaction.user.id);
      interaction.reply({ content: "❌ Tu as quitté le giveaway.", ephemeral: true });
    } else {
      data.participants.add(interaction.user.id);
      interaction.reply({ content: "🎉 Tu participes au giveaway !", ephemeral: true });
    }

    log(`Participant modifié : ${interaction.user.tag}`);
    return;
  }

  // ======================================================
  // 🎁 GIVEAWAY — VOIR LES PARTICIPANTS
  // ======================================================
  if (id === "view_giveaway") {
    const data = giveaways.get(interaction.message.id);
    if (!data) {
      return interaction.reply({ content: "❌ Giveaway introuvable.", ephemeral: true });
    }

    const list = [...data.participants].map(id => `<@${id}>`).join("\n") || "Aucun participant";

    const embed = baseEmbed(COLOR_MAIN)
      .setTitle("👥 Participants au Giveaway")
      .setDescription(list);

    interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }
});

// ======================================================
// 🟦 BLOC 5 — MODÉRATION AVANCÉE
// ======================================================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = interaction.commandName;
  const guild = interaction.guild;
  const member = interaction.member;

  // Fonction log
  const log = (txt) => {
    const embed = baseEmbed(COLOR_INFO)
      .setTitle("📘 Log — Modération")
      .setDescription(txt)
      .addFields({ name: "Modérateur", value: `${interaction.user.tag}` });

    sendLog(guild, embed);
  };

  // ======================================================
  // ⚠️ WARN
  // ======================================================
  if (cmd === "warn") {
    if (!isMod(member)) {
      return interaction.reply({ content: "⛔ Permission refusée.", ephemeral: true });
    }

    const target = interaction.options.getMember("membre");
    const reason = interaction.options.getString("raison") || "Aucune raison fournie";

    if (!target) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

    // Protection staff
    if (target.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: "⛔ Impossible de warn un membre du staff.", ephemeral: true });
    }

    if (!warns[target.id]) warns[target.id] = 0;
    warns[target.id] += 1;
    fs.writeFileSync("./warns.json", JSON.stringify(warns, null, 2));

    const embed = baseEmbed(COLOR_ERROR)
      .setTitle("⚠️ Warn attribué")
      .setDescription(
        `👤 **${target.user.tag}**\n` +
        `📄 **Raison :** ${reason}\n` +
        `🔢 **Warns total :** ${warns[target.id]}`
      );

    interaction.reply({ embeds: [embed] });
    log(`Warn → ${target.user.tag} (${reason})`);
    return;
  }

  // ======================================================
  // ♻️ UNWARN
  // ======================================================
  if (cmd === "unwarn") {
    if (!isMod(member)) {
      return interaction.reply({ content: "⛔ Permission refusée.", ephemeral: true });
    }

    const target = interaction.options.getMember("membre");
    if (!target) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

    if (!warns[target.id] || warns[target.id] <= 0) {
      return interaction.reply({ content: "ℹ️ Ce membre n’a aucun warn.", ephemeral: true });
    }

    warns[target.id] -= 1;
    fs.writeFileSync("./warns.json", JSON.stringify(warns, null, 2));

    const embed = baseEmbed(COLOR_SUCCESS)
      .setTitle("♻️ Warn retiré")
      .setDescription(
        `👤 **${target.user.tag}**\n` +
        `🔢 **Warns restants :** ${warns[target.id]}`
      );

    interaction.reply({ embeds: [embed] });
    log(`Unwarn → ${target.user.tag}`);
    return;
  }

  // ======================================================
  // 📋 WARNINGS
  // ======================================================
  if (cmd === "warnings") {
    const target = interaction.options.getMember("membre");
    if (!target) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

    const count = warns[target.id] || 0;

    const embed = baseEmbed(COLOR_MAIN)
      .setTitle("📋 Historique des warns")
      .setDescription(
        `👤 **${target.user.tag}**\n` +
        `🔢 **Warns :** ${count}`
      );

    interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  // ======================================================
  // 🔇 MUTE
  // ======================================================
  if (cmd === "mute") {
    if (!isMod(member)) {
      return interaction.reply({ content: "⛔ Permission refusée.", ephemeral: true });
    }

    const target = interaction.options.getMember("membre");
    const durationStr = interaction.options.getString("durée");
    const reason = interaction.options.getString("raison") || "Aucune raison fournie";

    if (!target) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

    // Protection staff
    if (target.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: "⛔ Impossible de mute un membre du staff.", ephemeral: true });
    }

    const durationMs = ms(durationStr);
    if (!durationMs) {
      return interaction.reply({ content: "❌ Durée invalide. Exemple : 10m, 1h, 2d", ephemeral: true });
    }

    await target.timeout(durationMs, reason).catch(() => {});

    const embed = baseEmbed(COLOR_ERROR)
      .setTitle("🔇 Mute appliqué")
      .setDescription(
        `👤 **${target.user.tag}**\n` +
        `⏳ **Durée :** ${durationStr}\n` +
        `📄 **Raison :** ${reason}`
      );

    interaction.reply({ embeds: [embed] });
    log(`Mute → ${target.user.tag} (${durationStr})`);
    return;
  }

  // ======================================================
  // 👢 KICK
  // ======================================================
  if (cmd === "kick") {
    if (!isMod(member)) {
      return interaction.reply({ content: "⛔ Permission refusée.", ephemeral: true });
    }

    const target = interaction.options.getMember("membre");
    const reason = interaction.options.getString("raison") || "Aucune raison fournie";

    if (!target) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

    // Protection staff
    if (target.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: "⛔ Impossible de kick un membre du staff.", ephemeral: true });
    }

    await target.kick(reason).catch(() => {});

    const embed = baseEmbed(COLOR_ERROR)
      .setTitle("👢 Kick effectué")
      .setDescription(
        `👤 **${target.user.tag}**\n` +
        `📄 **Raison :** ${reason}`
      );

    interaction.reply({ embeds: [embed] });
    log(`Kick → ${target.user.tag}`);
    return;
  }

  // ======================================================
  // 🔨 BAN
  // ======================================================
  if (cmd === "ban") {
    if (!isMod(member)) {
      return interaction.reply({ content: "⛔ Permission refusée.", ephemeral: true });
    }

    const target = interaction.options.getMember("membre");
    const reason = interaction.options.getString("raison") || "Aucune raison fournie";

    if (!target) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

    // Protection staff
    if (target.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: "⛔ Impossible de bannir un membre du staff.", ephemeral: true });
    }

    await target.ban({ reason }).catch(() => {});

    const embed = baseEmbed(COLOR_ERROR)
      .setTitle("🔨 Ban appliqué")
      .setDescription(
        `👤 **${target.user.tag}**\n` +
        `📄 **Raison :** ${reason}`
      );

    interaction.reply({ embeds: [embed] });
    log(`Ban → ${target.user.tag}`);
    return;
  }
});

// ======================================================
// 🟦 BLOC 7 — ENREGISTREMENT AUTOMATIQUE DES COMMANDES SLASH (REST)
// ======================================================

const { REST, Routes } = require("discord.js");

const GUILD_ID = "1472637775281918123"; // Serveur Nancy RP
const CLIENT_ID = client.user?.id;      // ID du bot

client.on("ready", async () => {
  console.log(`🟦 Connecté en tant que ${client.user.tag}`);
  console.log("🟦 Synchronisation des commandes slash…");

  // Liste complète des commandes slash
  const commands = [
    // Commandes générales
    {
      name: "help",
      description: "Affiche l'aide du bot Nancy RP"
    },
    {
      name: "panel",
      description: "Ouvre le panel staff"
    },

    // RAID
    {
      name: "raid",
      description: "Active le Raid Mode (Staff Raid uniquement)"
    },
    {
      name: "unraid",
      description: "Désactive le Raid Mode (Staff Raid uniquement)"
    },
    {
      name: "raidsim",
      description: "Simule une alerte RAID (Staff Raid uniquement)"
    },

    // Anti-bot
    {
      name: "antibot",
      description: "Active ou désactive l'anti-bot",
      options: [
        {
          name: "mode",
          description: "on / off",
          type: 3,
          required: true,
          choices: [
            { name: "on", value: "on" },
            { name: "off", value: "off" }
          ]
        }
      ]
    },

    // Sauvegarde / Restauration
    {
      name: "save",
      description: "Sauvegarde la structure du serveur"
    },
    {
      name: "load",
      description: "Restaure la dernière sauvegarde"
    },

    // Giveaway
    {
      name: "giveaway",
      description: "Créer un giveaway",
      options: [
        {
          name: "durée",
          description: "Durée en minutes",
          type: 4,
          required: true
        },
        {
          name: "récompense",
          description: "Nom de la récompense",
          type: 3,
          required: true
        },
        {
          name: "image",
          description: "URL d'une image (optionnel)",
          type: 3,
          required: false
        }
      ]
    },

    // Modération
    {
      name: "warn",
      description: "Avertit un membre",
      options: [
        {
          name: "membre",
          description: "Le membre à avertir",
          type: 6,
          required: true
        },
        {
          name: "raison",
          description: "Raison du warn",
          type: 3,
          required: false
        }
      ]
    },
    {
      name: "unwarn",
      description: "Retire un avertissement à un membre",
      options: [
        {
          name: "membre",
          description: "Le membre à unwarn",
          type: 6,
          required: true
        }
      ]
    },
    {
      name: "warnings",
      description: "Affiche le nombre de warns d'un membre",
      options: [
        {
          name: "membre",
          description: "Le membre à vérifier",
          type: 6,
          required: true
        }
      ]
    },
    {
      name: "mute",
      description: "Mute un membre avec une durée",
      options: [
        {
          name: "membre",
          description: "Le membre à mute",
          type: 6,
          required: true
        },
        {
          name: "durée",
          description: "Exemple : 10m, 1h, 2d",
          type: 3,
          required: true
        },
        {
          name: "raison",
          description: "Raison du mute",
          type: 3,
          required: false
        }
      ]
    },
    {
      name: "kick",
      description: "Kick un membre",
      options: [
        {
          name: "membre",
          description: "Le membre à kick",
          type: 6,
          required: true
        },
        {
          name: "raison",
          description: "Raison du kick",
          type: 3,
          required: false
        }
      ]
    },
    {
      name: "ban",
      description: "Ban un membre",
      options: [
        {
          name: "membre",
          description: "Le membre à bannir",
          type: 6,
          required: true
        },
        {
          name: "raison",
          description: "Raison du ban",
          type: 3,
          required: false
        }
      ]
    }
  ];

  // REST Discord
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("🟦 Commandes slash synchronisées avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation des commandes :", error);
  }
});

// ======================================================
// 🟦 JOIN — IMAGE PERSONNALISÉE (CANVAS)
// ======================================================

client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get(JOIN_CHANNEL_ID);
  if (!channel) return;

  // Charger le fond
  const background = await Canvas.loadImage("./assets/nancy_background.png");

  // Canvas
  const canvas = Canvas.createCanvas(1200, 400);
  const ctx = canvas.getContext("2d");

  // Dessiner le fond
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // Avatar
  const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: "png", size: 256 }));

  // Cercle avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(200, 200, 120, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 80, 80, 240, 240);
  ctx.restore();

  // Texte
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "50px Sans-serif";
  ctx.fillText("Bienvenue sur Nancy RP !", 380, 170);

  ctx.font = "35px Sans-serif";
  ctx.fillText("Ravi de t’accueillir parmi nous.", 380, 240);

  // Export
  const attachment = { files: [{ attachment: canvas.toBuffer(), name: "welcome.png" }] };

  // Embed d'informations
  const embed = baseEmbed(COLOR_MAIN)
    .setTitle("💙 Nouveau membre sur Nancy RP")
    .setDescription(
      `👤 **${member.user.username}**\n\n` +
      `📌 Tu es le **${member.guild.memberCount}ᵉ membre**\n` +
      `📅 **Compte créé le :** <t:${Math.floor(member.user.createdTimestamp / 1000)}:D>\n` +
      `🕒 **Arrivé le :** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
      `🎮 **Bon jeu à toi !**`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

  // Envoi
  channel.send({ content: `<@${member.id}>`, embeds: [embed], files: attachment.files });

  // LOG
  const logEmbed = baseEmbed(COLOR_INFO)
    .setTitle("📘 Log — Join")
    .setDescription(`Le membre **${member.user.tag}** vient de rejoindre le serveur.`);

  sendLog(member.guild, logEmbed);
});

// ======================================================
// 🟦 LEAVE — IMAGE PERSONNALISÉE (CANVAS)
// ======================================================

client.on("guildMemberRemove", async (member) => {
  const channel = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
  if (!channel) return;

  // Charger le fond (même image que JOIN)
  const background = await Canvas.loadImage("./assets/nancy_background.png");

  // Canvas
  const canvas = Canvas.createCanvas(1200, 400);
  const ctx = canvas.getContext("2d");

  // Dessiner le fond
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // Avatar
  const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: "png", size: 256 }));

  // Cercle avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(200, 200, 120, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 80, 80, 240, 240);
  ctx.restore();

  // Texte
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "50px Sans-serif";
  ctx.fillText("À bientôt sur Nancy RP !", 380, 170);

  ctx.font = "35px Sans-serif";
  ctx.fillText("Merci d’avoir été parmi nous.", 380, 240);

  // Export
  const attachment = { files: [{ attachment: canvas.toBuffer(), name: "goodbye.png" }] };

  // Embed d'informations
  const embed = baseEmbed(COLOR_ERROR)
    .setTitle("❤️ Départ d’un membre")
    .setDescription(
      `👤 **${member.user.username}** a quitté Nancy RP.\n\n` +
      `📅 **Compte créé le :** <t:${Math.floor(member.user.createdTimestamp / 1000)}:D>\n` +
      `🕒 **Départ :** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
      `🌺 Nous lui souhaitons une bonne continuation.`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

  // Envoi
  channel.send({ embeds: [embed], files: attachment.files });

  // LOG
  const logEmbed = baseEmbed(COLOR_ERROR)
    .setTitle("📘 Log — Leave")
    .setDescription(`Le membre **${member.user.tag}** a quitté le serveur.`);

  sendLog(member.guild, logEmbed);
});

// ======================================================
// 🟦 BLOC 10 — LOGIN FINAL + OPTIMISATIONS
// ======================================================

// Gestion des erreurs globales (évite les crashs)
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Erreur non gérée :", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Exception non gérée :", err);
});

// Vérification du token
if (!process.env.TOKEN) {
  console.error("❌ Aucun TOKEN trouvé dans process.env.TOKEN");
  console.error("➡️ Ajoute ton token dans un fichier .env :");
  console.error("TOKEN=ton_token_ici");
  process.exit(1);
}

// Message de démarrage
console.log("===============================================");
console.log("🚀 Démarrage du bot Nancy RP…");
console.log("📦 Chargement des modules…");
console.log("🛡️ Initialisation des systèmes de sécurité…");
console.log("🎁 Chargement des giveaways…");
console.log("📘 Chargement des commandes slash…");
console.log("===============================================");

// Connexion du bot
client.login(process.env.TOKEN).then(() => {
  console.log("===============================================");
  console.log(`💙 Bot connecté en tant que : ${client.user.tag}`);
  console.log("🌐 Serveur : Nancy RP");
  console.log("🔧 Tous les systèmes sont opérationnels.");
  console.log("===============================================");
});





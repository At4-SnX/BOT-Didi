// ======================================================
// 🟣 BLOC 1 — IMPORTS & CONFIG GLOBALE
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
// 🟣 BLOC 2 — CLIENT DISCORD
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
// 🟣 CONSTANTES GLOBALES
// ======================================================

const OWNER_ID = "1022469165824606258";

// Rôles warns (à adapter si besoin)
const WARN_ROLE_1 = "1482533960557789214";
const WARN_ROLE_2 = "1482533960557789214";
const WARN_ROLE_3 = "1482533960557789214";

const STAFF_ROLES = "1482533960557789214";



// Giveaway
const GIVEAWAY_ROLE_ID = "1482533960557789214";
const FOUNDATION_ROLE_ID = "1482533960557789214";

// Anti-bot
const BOT_WHITELIST = ["1472637775281918123"];

// Couleurs embeds
const COLOR_SUCCESS = "#8E44AD";
const COLOR_ERROR = "#E74C3C";
const COLOR_INFO = "#3498DB";

// Footer
const FOOTER = { text: "🌺 Nancy RP • Security Core" };

// Join / Leave
const JOIN_CHANNEL_ID = "1472639359311413441";
const LEAVE_CHANNEL_ID = "1472639378202558646";
const NANCY_GIF = "https://cdn.discordapp.com/attachments/1472650661685624852/1495404641515606126/NANCY_RP_4.gif";

// Tickets catégories
const categories = {
  "1488678969472454846": "report_staff",
  "1488679203590373557": "unban",
  "1488681903006421172": "partenariat",
  "1488681966990528593": "autre",
  "1488683247998079006": "report_joueur"
};

// États
const antiBotState = new Map();
const raidState = new Map();

// Snapshot serveur
let serverSnapshots = {};

// ======================================================
// 🟣 CHARGEMENT DES WARNS
// ======================================================

let warns = {};
if (fs.existsSync("./warns.json")) {
  warns = JSON.parse(fs.readFileSync("./warns.json"));
} else {
  fs.writeFileSync("./warns.json", "{}");
}

// ======================================================
// 🟣 FONCTIONS UTILITAIRES
// ======================================================

function isOwner(id) {
  return id === OWNER_ID;
}

function canUseGiveaway(member) {
  return (
    member.roles.cache.has(GIVEAWAY_ROLE_ID) ||
    member.roles.cache.has(FOUNDATION_ROLE_ID) ||
    member.id === OWNER_ID
  );
}

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

async function kickNonWhitelistedBots(guild) {
  const members = await guild.members.fetch();

  for (const [, member] of members) {
    if (member.user.bot && !BOT_WHITELIST.includes(member.id) && member.id !== client.user.id) {
      await member.kick("Raid Mode : bot non whitelist").catch(() => {});
    }
  }
}

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

function formatDuration(msValue) {
  const totalSeconds = Math.floor(msValue / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${days}j ${hours}h ${minutes}m`;
}

// ======================================================
// 🟣 BLOC 3 — COMMANDES PREFIX (n.raid)
// ======================================================

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.interaction) return;
  if (!message.content) return;
  if (message.content.startsWith("/")) return;

  const prefix = "n.";
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const cmd = args.shift()?.toLowerCase();

  if (!isOwner(message.author.id)) {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_ERROR)
          .setTitle("⛔ Accès refusé")
          .setDescription("Cette commande est réservée au propriétaire du bot.")
          .setFooter(FOOTER)
      ]
    });
  }

  if (cmd === "raid") {
    const embed = new EmbedBuilder()
      .setColor(COLOR_ERROR)
      .setTitle("⚠️ Confirmation RAID")
      .setDescription("Veux‑tu vraiment activer le RAID Mode ?")
      .setFooter(FOOTER);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("confirm_raid_prefix").setLabel("Activer").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("cancel_raid_prefix").setLabel("Annuler").setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }
});

// ======================================================
// 🟣 BLOC 4 — ANTI-BOT (état + guildMemberAdd)
// ======================================================

client.on("guildMemberAdd", async (member) => {
  const enabled = antiBotState.get(member.guild.id);
  if (enabled) {
    if (member.user.bot && !BOT_WHITELIST.includes(member.id) && member.id !== client.user.id) {
      await member.kick("Anti-bot activé : bot non whitelist").catch(() => {});
      return;
    }
  }

  // ARRIVÉE (on réutilise le même event pour éviter les doublons)
  const channel = member.guild.channels.cache.get(JOIN_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(COLOR_SUCCESS)
    .setTitle("💜 Nouvelle arrivée")
    .setDescription(
      `🟣 ***${member.user.username}** vient de rejoindre **Nancy RP***.\n\n` +
        `- ***Bienvenue à toi !***\n` +
        `🌺 *Nous te souhaitons une **excellente expérience** sur le serveur*.`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setImage(NANCY_GIF)
    .setFooter(FOOTER)
    .setTimestamp();

  channel.send({
    content: `<@${member.id}>`,
    embeds: [embed]
  });
});

// ======================================================
// 🟣 BLOC 5 — BOUTONS RAID (prefix)
// ======================================================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const id = interaction.customId;

  if (id === "confirm_raid_prefix") {
    raidState.set(interaction.guild.id, { active: true });
    await lockChannels(interaction.guild);
    await kickNonWhitelistedBots(interaction.guild);

    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_ERROR)
          .setTitle("🚨 RAID MODE ACTIVÉ")
          .setDescription("🔮 Salons verrouillés\n🛑 Bots expulsés\n💜 Protection active")
          .setFooter(FOOTER)
      ],
      components: []
    });
  }

  if (id === "cancel_raid_prefix") {
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_INFO)
          .setTitle("Raid annulé")
          .setDescription("🟣 Le RAID Mode n’a pas été activé.")
          .setFooter(FOOTER)
      ],
      components: []
    });
  }
});

// ======================================================
// 🟣 BLOC 6 — COMMANDES SLASH (logique)
// ======================================================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = interaction.commandName;

  // Sécurité : ignorer si pas dans un serveur
  if (!interaction.guild) {
    return interaction.reply({ content: "Cette commande doit être utilisée dans un serveur.", ephemeral: true });
  }

  // HELP
  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setColor(COLOR_INFO)
      .setTitle("📘 Aide Nancy RP")
      .setDescription(
        [
          "🟣 **Commandes générales**",
          "`/help` — Affiche cette aide",
          "`/panel` — Ouvre le panel staff",
          "",
          "🛡️ **RAID**",
          "`/raid` — Active le Raid Mode",
          "`/unraid` — Désactive le Raid Mode",
          "`/raidsim` — Simule une alerte RAID",
          "",
          "🤖 **Anti-bot**",
          "`/antibot mode:on/off` — Active / désactive l’anti-bot",
          "",
          "💾 **Sauvegarde / Restauration**",
          "`/save` — Sauvegarde la structure du serveur",
          "`/load` — Restaure la dernière sauvegarde",
          "",
          "🎁 **Giveaway**",
          "`/giveaway durée:<minutes> récompense:<lot>`",
          "",
          "🔧 **Modération**",
          "`/warn` / `/unwarn` / `/warnings`",
          "`/mute` / `/kick` / `/ban`"
        ].join("\n")
      )
      .setFooter(FOOTER);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // PANEL (simple placeholder)
  if (cmd === "panel") {
    const embed = new EmbedBuilder()
      .setColor(COLOR_SUCCESS)
      .setTitle("🛠️ Panel Staff")
      .setDescription("Panel staff en cours de développement.\nLes fonctions principales sont déjà disponibles via les commandes slash.")
      .setFooter(FOOTER);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // RAID
  if (cmd === "raid") {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ERROR)
            .setTitle("⛔ Accès refusé")
            .setDescription("Cette commande est réservée au propriétaire du bot.")
            .setFooter(FOOTER)
        ],
        ephemeral: true
      });
    }

    raidState.set(interaction.guild.id, { active: true });
    await lockChannels(interaction.guild);
    await kickNonWhitelistedBots(interaction.guild);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_ERROR)
          .setTitle("🚨 RAID MODE ACTIVÉ")
          .setDescription("🔮 Salons verrouillés\n🛑 Bots expulsés\n💜 Protection active")
          .setFooter(FOOTER)
      ],
      ephemeral: false
    });
  }

  if (cmd === "unraid") {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ERROR)
            .setTitle("⛔ Accès refusé")
            .setDescription("Cette commande est réservée au propriétaire du bot.")
            .setFooter(FOOTER)
        ],
        ephemeral: true
      });
    }

    raidState.set(interaction.guild.id, { active: false });
    await unlockChannels(interaction.guild);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_SUCCESS)
          .setTitle("🟣 RAID MODE DÉSACTIVÉ")
          .setDescription("🔓 Salons déverrouillés\n💜 Retour à la normale")
          .setFooter(FOOTER)
      ]
    });
  }

  if (cmd === "raidsim") {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ERROR)
            .setTitle("⛔ Accès refusé")
            .setDescription("Cette commande est réservée au propriétaire du bot.")
            .setFooter(FOOTER)
        ],
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(COLOR_ERROR)
      .setTitle("🚨 SIMULATION RAID")
      .setDescription("Ceci est **une simulation** de RAID.\nAucune action réelle n’a été effectuée.")
      .setFooter(FOOTER);

    return interaction.reply({ embeds: [embed] });
  }

  // ANTIBOT
  if (cmd === "antibot") {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ERROR)
            .setTitle("⛔ Accès refusé")
            .setDescription("Cette commande est réservée au propriétaire du bot.")
            .setFooter(FOOTER)
        ],
        ephemeral: true
      });
    }

    const mode = interaction.options.getString("mode");
    const enabled = mode === "on";
    antiBotState.set(interaction.guild.id, enabled);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(enabled ? COLOR_SUCCESS : COLOR_ERROR)
          .setTitle("🤖 Anti-bot")
          .setDescription(enabled ? "L’anti-bot est maintenant **activé**." : "L’anti-bot est maintenant **désactivé**.")
          .setFooter(FOOTER)
      ],
      ephemeral: true
    });
  }

  // SAVE
  if (cmd === "save") {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ERROR)
            .setTitle("⛔ Accès refusé")
            .setDescription("Cette commande est réservée au propriétaire du bot.")
            .setFooter(FOOTER)
        ],
        ephemeral: true
      });
    }

    const snap = snapshotServer(interaction.guild);
    serverSnapshots[interaction.guild.id] = snap;

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_SUCCESS)
          .setTitle("💾 Sauvegarde effectuée")
          .setDescription("La structure du serveur a été sauvegardée.")
          .setFooter(FOOTER)
      ],
      ephemeral: true
    });
  }

  // LOAD
  if (cmd === "load") {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ERROR)
            .setTitle("⛔ Accès refusé")
            .setDescription("Cette commande est réservée au propriétaire du bot.")
            .setFooter(FOOTER)
        ],
        ephemeral: true
      });
    }

    const snap = serverSnapshots[interaction.guild.id];
    if (!snap) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ERROR)
            .setTitle("❌ Aucune sauvegarde")
            .setDescription("Aucune sauvegarde n’a été trouvée pour ce serveur.")
            .setFooter(FOOTER)
        ],
        ephemeral: true
      });
    }

    await restoreServer(interaction.guild, snap);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_SUCCESS)
          .setTitle("💾 Restauration effectuée")
          .setDescription("La structure du serveur a été restaurée.")
          .setFooter(FOOTER)
      ],
      ephemeral: true
    });
  }

  // GIVEAWAY
  if (cmd === "giveaway") {
    if (!canUseGiveaway(interaction.member)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ERROR)
            .setTitle("⛔ Accès refusé")
            .setDescription("Tu n’as pas les permissions pour lancer un giveaway.")
            .setFooter(FOOTER)
        ],
        ephemeral: true
      });
    }

    const dureeMinutes = interaction.options.getInteger("durée");
    const reward = interaction.options.getString("récompense");

    const endTime = Date.now() + dureeMinutes * 60 * 1000;

    const embed = new EmbedBuilder()
      .setColor(COLOR_SUCCESS)
      .setTitle("🎁 Giveaway")
      .setDescription(`🎉 **${reward}**\n\nFin dans **${dureeMinutes} minutes**.`)
      .setFooter(FOOTER)
      .setTimestamp(endTime);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("join_giveaway").setLabel("Participer").setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  // WARN
  if (cmd === "warn") {
    if (!interaction.member.permissions.has("ModerateMembers")) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ERROR)
            .setTitle("⛔ Accès refusé")
            .setDescription("Tu n’as pas les permissions pour warn.")
            .setFooter(FOOTER)
        ],
        ephemeral: true
      });
    }

    const member = interaction.options.getMember("membre");
    const reason = interaction.options.getString("raison") || "Aucune raison fournie";

    if (!member) {
      return interaction.reply({ content: "Membre introuvable.", ephemeral: true });
    }

    if (!warns[member.id]) warns[member.id] = 0;
    warns[member.id] += 1;
    fs.writeFileSync("./warns.json", JSON.stringify(warns, null, 2));

    const count = warns[member.id];

    const embed = new EmbedBuilder()
      .setColor(COLOR_ERROR)
      .setTitle("⚠️ Warn")
      .setDescription(`**${member.user.tag}** a été averti.\nRaison : ${reason}\nWarns : **${count}**`)
      .setFooter(FOOTER);

    await interaction.reply({ embeds: [embed] });
  }

  // UNWARN
  if (cmd === "unwarn") {
    if (!interaction.member.permissions.has("ModerateMembers")) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ERROR)
            .setTitle("⛔ Accès refusé")
            .setDescription("Tu n’as pas les permissions pour unwarn.")
            .setFooter(FOOTER)
        ],
        ephemeral: true
      });
    }

    const member = interaction.options.getMember("membre");
    if (!member) {
      return interaction.reply({ content: "Membre introuvable.", ephemeral: true });
    }

    if (!warns[member.id] || warns[member.id] <= 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_INFO)
            .setTitle("ℹ️ Aucun warn")
            .setDescription(`${member.user.tag} n’a aucun warn.`)
            .setFooter(FOOTER)
        ],
        ephemeral: true
      });
    }

    warns[member.id] -= 1;
    fs.writeFileSync("./warns.json", JSON.stringify(warns, null, 2));

    const embed = new EmbedBuilder()
      .setColor(COLOR_SUCCESS)
      .setTitle("✅ Unwarn")
      .setDescription(`Un warn a été retiré à **${member.user.tag}**.\nWarns restants : **${warns[member.id]}**`)
      .setFooter(FOOTER);

    await interaction.reply({ embeds: [embed] });
  }

  // WARNINGS
  if (cmd === "warnings") {
    const member = interaction.options.getMember("membre");
    if (!member) {
      return interaction.reply({ content: "Membre introuvable.", ephemeral: true });
    }

    const count = warns[member.id] || 0;

    const embed = new EmbedBuilder()
      .setColor(COLOR_INFO)
      .setTitle("📋 Warns")
      .setDescription(`**${member.user.tag}** a **${count}** warn(s).`)
      .setFooter(FOOTER);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // MUTE
  if (cmd === "mute") {
    if (!interaction.member.permissions.has("ModerateMembers")) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ERROR)
            .setTitle("⛔ Accès refusé")
            .setDescription("Tu n’as pas les permissions pour mute.")
            .setFooter(FOOTER)
        ],
        ephemeral: true
      });
    }

    const member = interaction.options.getMember("membre");
// 🔒 Protection staff
if (member.roles.cache.some(r => STAFF_ROLES.includes(r.id))) {
  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLOR_ERROR)
        .setTitle("⛔ Action interdite")
        .setDescription("Tu ne peux pas mute un membre du staff.")
        .setFooter(FOOTER)
    ],
    ephemeral: true
  });
}

    const durationStr = interaction.options.getString("durée");
    const reason = interaction.options.getString("raison") || "Aucune raison fournie";

    if (!member) {
      return interaction.reply({ content: "Membre introuvable.", ephemeral: true });
    }

    const durationMs = ms(durationStr);
    if (!durationMs) {
      return interaction.reply({ content: "Durée invalide. Exemple : 10m, 1h, 2d", ephemeral: true });
    }

    await member.timeout(durationMs, reason).catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(COLOR_ERROR)
      .setTitle("🔇 Mute")
      .setDescription(
        `**${member.user.tag}** a été mute pour **${durationStr}**.\nRaison : ${reason}`
      )
      .setFooter(FOOTER);

    await interaction.reply({ embeds: [embed] });
  }

  // KICK
  if (cmd === "kick") {
    if (!interaction.member.permissions.has("KickMembers")) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ERROR)
            .setTitle("⛔ Accès refusé")
            .setDescription("Tu n’as pas les permissions pour kick.")
            .setFooter(FOOTER)
        ],
        ephemeral: true
      });
    }

    const member = interaction.options.getMember("membre");
// 🔒 Protection staff
if (member.roles.cache.some(r => STAFF_ROLES.includes(r.id))) {
  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLOR_ERROR)
        .setTitle("⛔ Action interdite")
        .setDescription("Tu ne peux pas sanctionner un membre du staff.")
        .setFooter(FOOTER)
    ],
    ephemeral: true
  });
}

    const reason = interaction.options.getString("raison") || "Aucune raison fournie";

    if (!member) {
      return interaction.reply({ content: "Membre introuvable.", ephemeral: true });
    }

    await member.kick(reason).catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(COLOR_ERROR)
      .setTitle("👢 Kick")
      .setDescription(`**${member.user.tag}** a été kick.\nRaison : ${reason}`)
      .setFooter(FOOTER);

    await interaction.reply({ embeds: [embed] });
  }

  // BAN
  if (cmd === "ban") {
    if (!interaction.member.permissions.has("BanMembers")) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ERROR)
            .setTitle("⛔ Accès refusé")
            .setDescription("Tu n’as pas les permissions pour ban.")
            .setFooter(FOOTER)
        ],
        ephemeral: true
      });
    }

    const member = interaction.options.getMember("membre");
// 🔒 Protection staff
if (member.roles.cache.some(r => STAFF_ROLES.includes(r.id))) {
  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLOR_ERROR)
        .setTitle("⛔ Action interdite")
        .setDescription("Tu ne peux pas bannir un membre du staff.")
        .setFooter(FOOTER)
    ],
    ephemeral: true
  });
}

    const reason = interaction.options.getString("raison") || "Aucune raison fournie";

    if (!member) {
      return interaction.reply({ content: "Membre introuvable.", ephemeral: true });
    }

    await member.ban({ reason }).catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(COLOR_ERROR)
      .setTitle("🔨 Ban")
      .setDescription(`**${member.user.tag}** a été banni.\nRaison : ${reason}`)
      .setFooter(FOOTER);

    await interaction.reply({ embeds: [embed] });
  }


// ======================================================
// 🟣 BLOC 7 — DÉPARTS (guildMemberRemove)
// ======================================================

client.on("guildMemberRemove", async (member) => {
  const channel = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
  if (!channel) return;

  let durationText = "Durée inconnue";
  if (member.joinedAt) {
    const duration = Date.now() - member.joinedAt.getTime();
    durationText = formatDuration(duration);
  }

  const embed = new EmbedBuilder()
    .setColor(COLOR_ERROR)
    .setTitle("🛑 Départ d’un membre")
    .setDescription(
      `🟣 ***${member.user.username}** a quitté **Nancy RP***.\n\n` +
        `- ***Temps passé sur le serveur :*** ${durationText}\n\n` +
        `🟣 *Nous lui souhaitons une bonne continuation*.`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setImage(NANCY_GIF)
    .setFooter(FOOTER)
    .setTimestamp();

  channel.send({
    content: `<@${member.id}>`,
    embeds: [embed]
  });
});

// ======================================================
// 🟣 BLOC 8 — TICKETS (messages texte)
// ======================================================

client.on("channelCreate", async (channel) => {
  setTimeout(async () => {
    if (!channel.parentId) return;

    const type = categories[channel.parentId];
    if (!type) return;

    let message = "";

    switch (type) {
      case "report_staff":
        message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━
🔮 **FORMULAIRE — SIGNALEMENT STAFF**
━━━━━━━━━━━━━━━━━━━━━━━━━━

🟣 Merci de remplir ce formulaire avec sérieux.  
Les signalements abusifs ne seront pas traités.

💜 **Identité du Staff :**  
> *(Nom du staff concerné)*

🕒 **Date & Heure :**  
> *(Exemple : 15/03/2026 — 22h40)*

📍 **Contexte :**  
> *(Scène, intervention staff, vocal, ticket…)*

📄 **Description complète :**  
> *(Explique clairement ce qu’il s’est passé)*

📎 **Preuves :**  
> *(Screens, vidéos, logs — obligatoire si possible)*

━━━━━━━━━━━━━━━━━━━━━━━━━━
${NANCY_GIF}
━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        break;

      case "unban":
        message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━
🔮 **FORMULAIRE — DEMANDE D'UNBAN**
━━━━━━━━━━━━━━━━━━━━━━━━━━

🟣 Merci de fournir les informations nécessaires.

💜 **Identité (Pseudo IG / ID Roblox) :**  
> *(Votre nom en jeu + ID Roblox)*

🕒 **Date du bannissement :**  
> *(Approximative si inconnue)*

📄 **Raison du bannissement :**  
> *(Ce qui vous a été reproché)*

🔮 **Pourquoi souhaitez-vous être unban ?**  
> *(Expliquez votre démarche et votre remise en question)*

📎 **Éléments supplémentaires :**  
> *(Screens, explications, contexte…)*

━━━━━━━━━━━━━━━━━━━━━━━━━━
${NANCY_GIF}
━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        break;

      case "partenariat":
        message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━
🔮 **FORMULAIRE — DEMANDE DE PARTENARIAT**
━━━━━━━━━━━━━━━━━━━━━━━━━━

🟣 Merci de lire les conditions avant de poursuivre.

💜 **Conditions minimales :**  
> • 150 membres réels  
> • Serveur actif  
> • Présentation claire  
> • Aucun contenu illégal / NSFW  

🔮 **Engagements attendus :**  
> • Publication de notre annonce  
> • Ajout dans vos partenaires  
> • Respect des valeurs Nancy RP  

📄 **Informations à fournir :**  
> 🔗 Lien du serveur  
> 👥 Nombre de membres  
> 📘 Présentation  
> 🎯 Motivation  
> 📣 Engagements  

━━━━━━━━━━━━━━━━━━━━━━━━━━
${NANCY_GIF}
━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        break;

      case "autre":
        message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━
🔮 **FORMULAIRE — DEMANDE SPÉCIALE**
━━━━━━━━━━━━━━━━━━━━━━━━━━

🟣 Merci de préciser votre demande.

💜 **Identité (Pseudo IG) :**  
> *(Votre pseudo)*

🆔 **Identité Discord :**  
> *(Votre tag Discord)*

🎯 **Nature de la demande :**  
> *(Ce que vous souhaitez)*

📄 **Description complète :**  
> *(Expliquez clairement votre demande)*

📎 **Documents (si nécessaire) :**  
> *(Screens, fichiers…)*

🗣️ **Avez-vous déjà parlé à un staff ?**  
> *(Oui / Non)*

━━━━━━━━━━━━━━━━━━━━━━━━━━
${NANCY_GIF}
━━━━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        break;

      case "report_joueur":
        message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━
🔮 **FORMULAIRE — SIGNALEMENT JOUEUR**
━━━━━━━━━━━━━━━━━━━━━━━━━━

🟣 Merci de remplir ce formulaire correctement.

💜 **Identité du joueur :**  
> *(Nom du joueur concerné)*

🕒 **Date & Heure :**  
> *(Quand cela s’est produit)*

📍 **Lieu :**  
> *(Zone, scène, contexte)*

📄 **Description :**  
> *(Explique ce qu’il s’est passé)*

📎 **Preuves :**  
> *(Screens, vidéos, logs)*

━━━━━━━━━━━━━━━━━━━━━━━━━━
${NANCY_GIF}
━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        break;
    }

    if (!message) return;
    await channel.send(message);
  }, 2000);
});

// ======================================================
// 🟣 BLOC 9 — READY (ENREGISTREMENT DES COMMANDES SLASH LOCALES)
// ======================================================

client.on("ready", async () => {
  console.log(`🟣 Connecté en tant que ${client.user.tag}`);

  const guild = client.guilds.cache.get("1472637775281918123");
  if (!guild) {
    console.log("❌ Impossible de trouver le serveur Nancy RP.");
    return;
  }

  console.log("🟣 Enregistrement des commandes slash locales...");

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
      description: "Active le Raid Mode (OWNER uniquement)"
    },
    {
      name: "unraid",
      description: "Désactive le Raid Mode (OWNER uniquement)"
    },
    {
      name: "raidsim",
      description: "Simulation de Raid (OWNER uniquement)"
    },

    // Anti-bot
    {
      name: "antibot",
      description: "Active ou désactive l'anti-bot (OWNER uniquement)",
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
      description: "Sauvegarde la structure du serveur (OWNER uniquement)"
    },
    {
      name: "load",
      description: "Restaure la dernière sauvegarde (OWNER uniquement)"
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

  await guild.commands.set(commands);
  console.log("🟣 Commandes slash LOCALES enregistrées (instantanées).");
});

// ======================================================
// 🟣 BLOC 10 — LOGIN
// ======================================================

client.login(process.env.TOKEN);






// ======================================================
// 🟣 NANCY RP — BOT PREMIUM ULTRA VIOLET LUXE
// ======================================================

const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection
} = require("discord.js");

// ======================================================
// 🟣 CLIENT INITIALISATION
// ======================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

// ======================================================
// 🟣 CONFIGURATION NANCY RP
// ======================================================

const OWNER_ID = "1022469165824606258";
const ANNOUNCE_CHANNEL_ID = "1472639290163859638";
const GIVEAWAY_ROLE_ID = "1492873377017237618";
const FOUNDATION_ROLE_ID = "1472661671972442387";
const PREFIX = "n.";

// Whitelist bots
const BOT_WHITELIST = [
  "466578580449525760",
  "614755681936867328",
  "1184200228266573854",
  "1475133951625658551",
  "318312854816161792"
];


// Tickets catégories
const categories = {
  "1488678969472454846": "report_staff",
  "1488679203590373557": "unban",
  "1488681903006421172": "partenariat",
  "1488681966990528593": "autre",
  "1488683247998079006": "report_joueur",
  "1495810265474928732": "fondation"
};

// États internes
const raidState = new Map();
const antiBotState = new Map();
const serverSaves = new Map();
const giveaways = new Collection();

// ======================================================
// 🟣 STYLE PREMIUM — ULTRA VIOLET LUXE
// ======================================================

const COLOR_MAIN = 0x8e44ad;      // Violet Royal
const COLOR_SUCCESS = 0x9b59b6;   // Violet clair luxe
const COLOR_ERROR = 0xc0392b;     // Rouge foncé
const COLOR_RAID = 0xe74c3c;      // Rouge premium

const FOOTER = { text: "🌺 Nancy RP • Security core" };

// ======================================================
// 🟣 FONCTIONS EMBEDS PREMIUM
// ======================================================

function embedInfo(title, description) {
  return new EmbedBuilder()
    .setColor(COLOR_MAIN)
    .setTitle(`🔮 ${title}`)
    .setDescription(description)
    .setFooter(FOOTER)
    .setTimestamp();
}

function embedSuccess(title, description) {
  return new EmbedBuilder()
    .setColor(COLOR_SUCCESS)
    .setTitle(`✨ ${title}`)
    .setDescription(description)
    .setFooter(FOOTER)
    .setTimestamp();
}

function embedError(title, description) {
  return new EmbedBuilder()
    .setColor(COLOR_ERROR)
    .setTitle(`🛑 ${title}`)
    .setDescription(description)
    .setFooter(FOOTER)
    .setTimestamp();
}

function embedRaidAlert(simulation = false) {
  return new EmbedBuilder()
    .setColor(simulation ? 0xf1c40f : COLOR_RAID)
    .setTitle(simulation ? "🟡 Simulation de RAID" : "🚨 RAID ACTIVÉ")
    .setDescription(
      simulation
        ? "Ceci est **une simulation** du RAID Mode.\nAucune action réelle n’a été appliquée."
        : "Le **RAID MODE** est maintenant actif.\nLes salons sont verrouillés et les bots non whitelist sont expulsés."
    )
    .setFooter(FOOTER)
    .setTimestamp();
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

// ======================================================
// 🟣 TICKETS — VERSION SANS EMBEDS (MESSAGES ESTHÉTIQUES)
// ======================================================

client.on("channelCreate", async (channel) => {
  setTimeout(async () => {
    if (!channel.parentId) return;

    const type = categories[channel.parentId];
    if (!type) return;

    let message = "";

    switch (type) {

      // ======================================================
      // 🔮 SIGNALEMENT STAFF
      // ======================================================
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
https://cdn.discordapp.com/attachments/1472650661685624852/1495404641515606126/NANCY_RP_4.gif
━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        break;

      // ======================================================
      // 🔮 DEMANDE D'UNBAN
      // ======================================================
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
https://cdn.discordapp.com/attachments/1472650661685624852/1495404641515606126/NANCY_RP_4.gif
━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        break;

      // ======================================================
      // 🔮 PARTENARIAT
      // ======================================================
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
https://cdn.discordapp.com/attachments/1472650661685624852/1495404641515606126/NANCY_RP_4.gif
━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        break;

      // ======================================================
      // 🔮 DEMANDE SPÉCIALE
      // ======================================================
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
https://cdn.discordapp.com/attachments/1472650661685624852/1495404641515606126/NANCY_RP_4.gif
━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        break;

      // ======================================================
      // 🔮 SIGNALEMENT JOUEUR
      // ======================================================
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
https://cdn.discordapp.com/attachments/1472650661685624852/1495404641515606126/NANCY_RP_4.gif
━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        break;

      // ======================================================
      // 🔮 DEMANDE À LA FONDATION (NOUVEAU)
      // ======================================================
      case "fondation":
        message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━
🔮 **FORMULAIRE — DEMANDE À LA FONDATION**
━━━━━━━━━━━━━━━━━━━━━━━━━━

🟣 Ce ticket est destiné aux demandes importantes nécessitant  
l’intervention directe de **La Fondation Nancy RP**.

💜 **Identité (Pseudo IG) :**  
> *(Votre pseudo)*

🆔 **Identité Discord :**  
> *(Votre tag Discord)*

🎯 **Objet de la demande :**  
> *(Ce que vous souhaitez obtenir ou faire valider)*

📄 **Description complète :**  
> *(Expliquez clairement votre situation et votre requête)*

📎 **Documents / Preuves (si nécessaire) :**  
> *(Screens, fichiers, vidéos…)*

🔒 Votre demande sera étudiée par un membre de la Fondation.

━━━━━━━━━━━━━━━━━━━━━━━━━━
https://cdn.discordapp.com/attachments/1472650661685624852/1495404641515606126/NANCY_RP_4.gif
━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        break;
    }

    if (!message) return;

    await channel.send(message);
  }, 2000);
});


// ======================================================
// 🟣 COMMANDES PREFIX — VERSION PREMIUM ULTRA VIOLET LUXE
// ======================================================

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift()?.toLowerCase();

  // ======================================================
  // 🟣 HELP — n.help
  // ======================================================
  if (cmd === "help") {
    const embed = embedInfo(
      "Aide Nancy RP",
      [
        "🟣 **Préfixe :** `n.`",
        "",
        "🔮 **Protection & RAID**",
        "`n.raid` – Active le RAID Mode (confirmation requise)",
        "`n.unraid` – Désactive le RAID Mode",
        "`n.raidsim` – Simulation de RAID",
        "",
        "🟣 **Sécurité bots**",
        "`n.antibot on` – Active l’anti-bot",
        "`n.antibot off` – Désactive l’anti-bot",
        "",
        "💜 **Sauvegarde serveur**",
        "`n.save` – Sauvegarde la structure",
        "`n.load` – Restaure la dernière sauvegarde",
        "",
        "🎁 **Giveaway**",
        "Utilise `/giveaway` (Fondation + rôle giveaway)",
        "",
        "🔮 **Version slash :** `/help`"
      ].join("\n")
    );

    return message.channel.send({ embeds: [embed] });
  }

  // ======================================================
  // 🛡️ COMMANDES OWNER UNIQUEMENT
  // ======================================================
  if (!isOwner(message.author.id)) {
    return message.channel.send({
      embeds: [
        embedError(
          "Accès refusé",
          "Cette commande est réservée au propriétaire du bot."
        )
      ]
    });
  }

  // ======================================================
  // 🔥 RAID MODE — n.raid (avec confirmation)
  // ======================================================
  if (cmd === "raid") {
    const confirmEmbed = embedError(
      "Confirmation RAID Mode",
      "🟣 Es-tu sûr de vouloir **activer le RAID MODE** ?\n\n" +
        "Cette action va :\n" +
        "🔮 Verrouiller tous les salons\n" +
        "🛑 Expulser les bots non whitelist\n" +
        "💜 Activer la protection maximale"
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_raid_prefix")
        .setLabel("Activer le RAID")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("cancel_raid_prefix")
        .setLabel("Annuler")
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.channel.send({
      embeds: [confirmEmbed],
      components: [row]
    });

    // Collecteur de boutons
    const collector = msg.createMessageComponentCollector({
      time: 30000
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== OWNER_ID) {
        return interaction.reply({
          embeds: [
            embedError(
              "Non autorisé",
              "Seul le propriétaire du bot peut confirmer cette action."
            )
          ],
          ephemeral: true
        });
      }

      if (interaction.customId === "confirm_raid_prefix") {
        collector.stop("confirmed");

        raidState.set(message.guild.id, { active: true });
        await lockChannels(message.guild);
        await kickNonWhitelistedBots(message.guild);

        await interaction.update({
          embeds: [
            embedRaidAlert(false).setDescription(
              "🚨 **RAID MODE ACTIVÉ**\n\n" +
                "🔮 Salons verrouillés\n" +
                "🛑 Bots non whitelist expulsés\n" +
                "💜 Protection maximale active"
            )
          ],
          components: []
        });
      }

      if (interaction.customId === "cancel_raid_prefix") {
        collector.stop("cancelled");

        await interaction.update({
          embeds: [
            embedInfo(
              "Raid annulé",
              "🟣 Le RAID Mode n’a pas été activé."
            )
          ],
          components: []
        });
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time") {
        await msg.edit({
          embeds: [
            embedError(
              "Confirmation expirée",
              "🕒 Tu n’as pas confirmé à temps."
            )
          ],
          components: []
        });
      }
    });

    return;
  }

  // ======================================================
  // 🔓 n.unraid
  // ======================================================
  if (cmd === "unraid") {
    raidState.set(message.guild.id, { active: false });
    await unlockChannels(message.guild);

    return message.channel.send({
      embeds: [
        embedSuccess(
          "RAID Mode désactivé",
          "🟣 Les salons ont été déverrouillés."
        )
      ]
    });
  }

  // ======================================================
  // 🟡 n.raidsim
  // ======================================================
if (cmd === "raidsim") {
  const embed = embedRaidAlert(true);

  // Envoi dans le salon actuel
  await message.channel.send({ embeds: [embed] });

  // Envoi dans le salon d’annonce
  const announce = message.guild.channels.cache.get(ANNOUNCE_CHANNEL_ID);
  if (announce) {
    await announce.send({
      embeds: [
        embedInfo(
          "Simulation RAID — Notification",
          "🟡 Une **simulation de RAID** vient d’être effectuée.\nAucune action réelle n’a été appliquée."
        )
      ]
    });
  }

  return;
}

  // ======================================================
  // 🤖 n.antibot
  // ======================================================
  if (cmd === "antibot") {
    const mode = (args[0] || "").toLowerCase();

    if (!["on", "off"].includes(mode)) {
      return message.channel.send({
        embeds: [
          embedError(
            "Utilisation incorrecte",
            "Format attendu : `n.antibot on` ou `n.antibot off`"
          )
        ]
      });
    }

    const enabled = mode === "on";
    antiBotState.set(message.guild.id, enabled);

    return message.channel.send({
      embeds: [
        embedSuccess(
          "Anti-bot mis à jour",
          enabled
            ? "🔮 L’anti-bot est maintenant **activé**."
            : "🟣 L’anti-bot est maintenant **désactivé**."
        )
      ]
    });
  }

  // ======================================================
  // 💾 n.save
  // ======================================================
  if (cmd === "save") {
    const snap = snapshotServer(message.guild);
    serverSaves.set(message.guild.id, snap);

    return message.channel.send({
      embeds: [
        embedSuccess(
          "Sauvegarde effectuée",
          "🟣 La structure du serveur a été sauvegardée."
        )
      ]
    });
  }

  // ======================================================
  // 💾 n.load
  // ======================================================
  if (cmd === "load") {
    const snap = serverSaves.get(message.guild.id);

    if (!snap) {
      return message.channel.send({
        embeds: [
          embedError(
            "Aucune sauvegarde",
            "Aucune sauvegarde n’a été trouvée pour ce serveur."
          )
        ]
      });
    }

    await restoreServer(message.guild, snap);

    return message.channel.send({
      embeds: [
        embedSuccess(
          "Restauration terminée",
          "🟣 La structure du serveur a été restaurée."
        )
      ]
    });
  }
});

// ======================================================
// 🟣 COMMANDES SLASH — VERSION PREMIUM ULTRA VIOLET LUXE
// ======================================================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // ======================================================
  // 🟣 /help
  // ======================================================
  if (commandName === "help") {
    const embed = embedInfo(
      "Aide Nancy RP",
      [
        "🟣 **Préfixe :** `n.`",
        "",
        "🔮 **Protection & RAID**",
        "`/raid` – Active le RAID Mode (confirmation requise)",
        "`/unraid` – Désactive le RAID Mode",
        "`/raidsim` – Simulation de RAID",
        "",
        "🟣 **Sécurité bots**",
        "`/antibot mode:on/off` – Active/Désactive l’anti-bot",
        "",
        "💜 **Sauvegarde serveur**",
        "`/save` – Sauvegarde la structure",
        "`/load` – Restaure la dernière sauvegarde",
        "",
        "🎁 **Giveaway**",
        "`/giveaway durée:<minutes> récompense:<texte>`",
        "",
        "🔮 **Version préfixe :** `n.help`"
      ].join("\n")
    );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ======================================================
  // 🛡️ COMMANDES OWNER UNIQUEMENT
  // ======================================================
  if (["raid", "unraid", "raidsim", "antibot", "save", "load"].includes(commandName)) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          embedError(
            "Accès refusé",
            "Cette commande est réservée au propriétaire du bot."
          )
        ],
        ephemeral: true
      });
    }
  }

  // ======================================================
  // 🔥 /raid — Confirmation interactive
  // ======================================================
  if (commandName === "raid") {
    const confirmEmbed = embedError(
      "Confirmation RAID Mode",
      "🟣 Es-tu sûr de vouloir **activer le RAID MODE** ?\n\n" +
        "Cette action va :\n" +
        "🔮 Verrouiller tous les salons\n" +
        "🛑 Expulser les bots non whitelist\n" +
        "💜 Activer la protection maximale"
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_raid_slash")
        .setLabel("Activer le RAID")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("cancel_raid_slash")
        .setLabel("Annuler")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      ephemeral: true
    });

    return;
  }

  // ======================================================
  // 🔓 /unraid
  // ======================================================
  if (commandName === "unraid") {
    raidState.set(interaction.guild.id, { active: false });
    await unlockChannels(interaction.guild);

    return interaction.reply({
      embeds: [
        embedSuccess(
          "RAID Mode désactivé",
          "🟣 Les salons ont été déverrouillés."
        )
      ],
      ephemeral: true
    });
  }

  // ======================================================
  // 🟡 /raidsim
  // ======================================================
  if (commandName === "raidsim") {
    const embed = embedRaidAlert(true);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ======================================================
  // 🤖 /antibot
  // ======================================================
  if (commandName === "antibot") {
    const mode = interaction.options.getString("mode");
    const enabled = mode === "on";

    antiBotState.set(interaction.guild.id, enabled);

    return interaction.reply({
      embeds: [
        embedSuccess(
          "Anti-bot mis à jour",
          enabled
            ? "🔮 L’anti-bot est maintenant **activé**."
            : "🟣 L’anti-bot est maintenant **désactivé**."
        )
      ],
      ephemeral: true
    });
  }

  // ======================================================
  // 💾 /save
  // ======================================================
  if (commandName === "save") {
    const snap = snapshotServer(interaction.guild);
    serverSaves.set(interaction.guild.id, snap);

    return interaction.reply({
      embeds: [
        embedSuccess(
          "Sauvegarde effectuée",
          "🟣 La structure du serveur a été sauvegardée."
        )
      ],
      ephemeral: true
    });
  }

  // ======================================================
  // 💾 /load
  // ======================================================
  if (commandName === "load") {
    const snap = serverSaves.get(interaction.guild.id);

    if (!snap) {
      return interaction.reply({
        embeds: [
          embedError(
            "Aucune sauvegarde",
            "Aucune sauvegarde n’a été trouvée pour ce serveur."
          )
        ],
        ephemeral: true
      });
    }

    await restoreServer(interaction.guild, snap);

    return interaction.reply({
      embeds: [
        embedSuccess(
          "Restauration terminée",
          "🟣 La structure du serveur a été restaurée."
        )
      ],
      ephemeral: true
    });
  }

  // ======================================================
  // 🎁 /giveaway
  // ======================================================
  if (commandName === "giveaway") {
    if (!canUseGiveaway(interaction.member)) {
      return interaction.reply({
        embeds: [
          embedError(
            "Accès refusé",
            "Tu n’as pas les permissions pour lancer un giveaway."
          )
        ],
        ephemeral: true
      });
    }

    const durationMinutes = interaction.options.getInteger("durée");
    const prize = interaction.options.getString("récompense");

    if (durationMinutes <= 0) {
      return interaction.reply({
        embeds: [
          embedError(
            "Durée invalide",
            "La durée doit être supérieure à 0."
          )
        ],
        ephemeral: true
      });
    }

    const endTime = Date.now() + durationMinutes * 60 * 1000;

    const embed = new EmbedBuilder()
      .setColor(COLOR_SUCCESS)
      .setTitle("🎁 Giveaway Premium")
      .setDescription(
        `💜 Récompense : **${prize}**\n` +
          `🔮 Réagis avec 🎉 pour participer !\n` +
          `🕒 Fin dans **${durationMinutes} minutes**.`
      )
      .setFooter(FOOTER)
      .setTimestamp(endTime);

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    await msg.react("🎉");

    giveaways.set(msg.id, {
      guildId: interaction.guild.id,
      channelId: msg.channel.id,
      messageId: msg.id,
      prize,
      endTime
    });

    // Timer de fin
    setTimeout(async () => {
      const data = giveaways.get(msg.id);
      if (!data) return;

      const channel = await client.channels.fetch(data.channelId).catch(() => null);
      if (!channel || !channel.isTextBased()) return;

      const message = await channel.messages.fetch(data.messageId).catch(() => null);
      if (!message) return;

      const reaction = message.reactions.cache.get("🎉");
      if (!reaction) return;

      const users = await reaction.users.fetch();
      const participants = users.filter((u) => !u.bot);

      if (!participants.size) {
        await channel.send({
          embeds: [
            embedError(
              "Aucun participant",
              "Personne n’a participé au giveaway."
            )
          ]
        });
        giveaways.delete(msg.id);
        return;
      }

      const winner = participants.random();

      await channel.send({
        embeds: [
          embedSuccess(
            "Gagnant du Giveaway",
            `🎉 Félicitations ${winner} !\nTu remportes **${data.prize}** !`
          )
        ]
      });

      giveaways.delete(msg.id);
    }, durationMinutes * 60 * 1000);
  }
});

// ======================================================
// 🟣 SYSTÈMES INTERNES — RAID, ANTIBOT, GIVEAWAY, LOGIN
// ======================================================

// ======================================================
// 🤖 ANTI-BOT — Kick automatique des bots non whitelist
// ======================================================

client.on("guildMemberAdd", async (member) => {
  if (!member.guild) return;

  const enabled = antiBotState.get(member.guild.id);
  if (!enabled) return;

  if (!member.user.bot) return;
  if (BOT_WHITELIST.includes(member.id)) return;
  if (member.id === client.user.id) return;

  await member.kick("Anti-bot activé : bot non whitelist").catch(() => {});
});

// ======================================================
// 🔘 GESTION DES BOUTONS — CONFIRMATION RAID (prefix + slash)
// ======================================================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const id = interaction.customId;

  // ======================================================
  // 🔥 RAID — Slash command confirmation
  // ======================================================
  if (id === "confirm_raid_slash") {
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        embeds: [
          embedError(
            "Non autorisé",
            "Seul le propriétaire du bot peut confirmer cette action."
          )
        ],
        ephemeral: true
      });
    }

    raidState.set(interaction.guild.id, { active: true });
    await lockChannels(interaction.guild);
    await kickNonWhitelistedBots(interaction.guild);

    return interaction.update({
      embeds: [
        embedRaidAlert(false).setDescription(
          "🚨 **RAID MODE ACTIVÉ**\n\n" +
            "🔮 Salons verrouillés\n" +
            "🛑 Bots non whitelist expulsés\n" +
            "💜 Protection maximale active"
        )
      ],
      components: []
    });
  }

  if (id === "cancel_raid_slash") {
    return interaction.update({
      embeds: [
        embedInfo(
          "Raid annulé",
          "🟣 Le RAID Mode n’a pas été activé."
        )
      ],
      components: []
    });
  }

  // ======================================================
  // 🔥 RAID — Prefix command confirmation
  // ======================================================
  if (id === "confirm_raid_prefix") {
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        embeds: [
          embedError(
            "Non autorisé",
            "Seul le propriétaire du bot peut confirmer cette action."
          )
        ],
        ephemeral: true
      });
    }

    raidState.set(interaction.guild.id, { active: true });
    await lockChannels(interaction.guild);
    await kickNonWhitelistedBots(interaction.guild);

    return interaction.update({
      embeds: [
        embedRaidAlert(false).setDescription(
          "🚨 **RAID MODE ACTIVÉ**\n\n" +
            "🔮 Salons verrouillés\n" +
            "🛑 Bots non whitelist expulsés\n" +
            "💜 Protection maximale active"
        )
      ],
      components: []
    });
  }

  if (id === "cancel_raid_prefix") {
    return interaction.update({
      embeds: [
        embedInfo(
          "Raid annulé",
          "🟣 Le RAID Mode n’a pas été activé."
        )
      ],
      components: []
    });
  }
});

// ======================================================
// 🎁 GIVEAWAY — Nettoyage automatique si message supprimé
// ======================================================

client.on("messageDelete", (message) => {
  if (giveaways.has(message.id)) {
    giveaways.delete(message.id);
  }
});

// ======================================================
// 🚀 READY — Enregistrement des commandes slash
// ======================================================

client.on("ready", async () => {
  console.log(`🟣 Connecté en tant que ${client.user.tag}`);

  if (!client.application?.commands) return;

  await client.application.commands.set([
    {
      name: "help",
      description: "Affiche l'aide du bot Nancy RP"
    },
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
    {
      name: "save",
      description: "Sauvegarde la structure du serveur (OWNER uniquement)"
    },
    {
      name: "load",
      description: "Restaure la dernière sauvegarde (OWNER uniquement)"
    },
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
    }
  ]);

  console.log("🟣 Commandes slash enregistrées.");
});

// ======================================================
// 🟣 BLOC 6 — ARRIVÉES & DÉPARTS (SALONS SÉPARÉS + PING + GIF + DURÉE)
// ======================================================

// Salon d'arrivée
const JOIN_CHANNEL_ID = "1472639359311413441";

// Salon de départ
const LEAVE_CHANNEL_ID = "1472639378202558646";

// GIF Nancy RP
const NANCY_GIF = "https://cdn.discordapp.com/attachments/1472650661685624852/1495404641515606126/NANCY_RP_4.gif";

// Fonction pour calculer la durée sur le serveur
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return `${days}j ${hours}h ${minutes}m`;
}

// ======================================================
// 🟣 ARRIVÉE D’UN MEMBRE
// ======================================================

client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get(JOIN_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(COLOR_SUCCESS)
    .setTitle("💜 Nouvelle arrivée")
    .setDescription(
      `🌺 ***${member.user.username}** vient de rejoindre **Nancy RP***.\n\n` +
      `- ***Bienvenue à toi !***\n` +
      `🌺 *Nous te souhaitons une **excellente expérience sur le serveur***.`
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
// 🔮 DÉPART D’UN MEMBRE (AVEC DURÉE SUR LE SERVEUR)
// ======================================================

client.on("guildMemberRemove", async (member) => {
  const channel = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
  if (!channel) return;

  // Calcul de la durée passée sur le serveur
  let durationText = "Durée inconnue";
  if (member.joinedAt) {
    const duration = Date.now() - member.joinedAt.getTime();
    durationText = formatDuration(duration);
  }

  const embed = new EmbedBuilder()
    .setColor(COLOR_ERROR)
    .setTitle("🛑 Départ d’un membre")
    .setDescription(
      `🌺 ***${member.user.username}** a quitté **Nancy RP***.\n\n` +
      `- ***Temps passé sur le serveur :*** ${durationText}\n\n` +
      `🌺 *Nous lui souhaitons une **bonne continuation***.`
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
// 🟣 BLOC 7 — PANEL STAFF (Embed Premium + Boutons)
// ======================================================

// CONFIG
const STAFF_ROLE_ID = "1482533960557789214"; // rôle staff autorisé

// ======================================================
// 🟣 COMMANDE PREFIX — n.panel
// ======================================================

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift()?.toLowerCase();

  if (cmd === "panel") {
    if (!message.member.roles.cache.has(STAFF_ROLE_ID)) {
      return message.reply("⛔ Tu n’as pas accès au panel staff.");
    }

    sendStaffPanel(message.channel);
  }
});

// ======================================================
// 🟣 COMMANDE SLASH — /panel
// ======================================================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "panel") {
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: "⛔ Tu n’as pas accès au panel staff.", ephemeral: true });
    }

    sendStaffPanel(interaction.channel);
    interaction.reply({ content: "🟣 Panel staff envoyé.", ephemeral: true });
  }
});

// ======================================================
// 🟣 FONCTION — ENVOI DU PANEL STAFF
// ======================================================

function sendStaffPanel(channel) {
  const embed = new EmbedBuilder()
    .setColor("#8E44AD")
    .setTitle("🟣 Panel Staff — Nancy RP")
    .setDescription(
      [
        "Bienvenue dans le **Panel Staff**.",
        "",
        "💠 **Sections disponibles :**",
        "> 🔧 Modération",
        "> 🎫 Tickets",
        "> 🛡️ Sécurité",
        "> 🧰 Outils Staff",
        "",
        "Utilise les boutons ci‑dessous pour naviguer."
      ].join("\n")
    )
    .setFooter({ text: "🌺 Nancy RP • Security Core" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("panel_moderation")
      .setLabel("🔧 Modération")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("panel_tickets")
      .setLabel("🎫 Tickets")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("panel_securite")
      .setLabel("🛡️ Sécurité")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("panel_outils")
      .setLabel("🧰 Outils")
      .setStyle(ButtonStyle.Primary)
  );

  channel.send({ embeds: [embed], components: [row] });
}

// ======================================================
// 🟣 PANEL STAFF — SOUS-MENUS (Embed Premium)
// ======================================================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
    return interaction.reply({ content: "⛔ Tu n’as pas accès à cette section.", ephemeral: true });
  }

  let embed;

  switch (interaction.customId) {

    case "panel_moderation":
      embed = new EmbedBuilder()
        .setColor("#8E44AD")
        .setTitle("🔧 Section Modération")
        .setDescription(
          [
            "💠 **Outils disponibles :**",
            "> • /warn",
            "> • /unwarn",
            "> • /warnings",
            "> • /mute",
            "> • /unmute",
            "> • /kick",
            "> • /ban",
            "> • /unban"
          ].join("\n")
        )
        .setFooter({ text: "🌺 Nancy RP • Security Core" });
      break;

    case "panel_tickets":
      embed = new EmbedBuilder()
        .setColor("#8E44AD")
        .setTitle("🎫 Section Tickets")
        .setDescription(
          [
            "💠 **Catégories :**",
            "> • Signalement Staff",
            "> • Signalement Joueur",
            "> • Demande d’Unban",
            "> • Partenariat",
            "> • Demande spéciale",
            "> • Demande Fondation"
          ].join("\n")
        )
        .setFooter({ text: "🌺 Nancy RP • Security Core" });
      break;

    case "panel_securite":
      embed = new EmbedBuilder()
        .setColor("#8E44AD")
        .setTitle("🛡️ Section Sécurité")
        .setDescription(
          [
            "💠 **Outils :**",
            "> • n.raid",
            "> • n.unraid",
            "> • n.raidsim",
            "> • n.antibot on/off",
            "> • Whitelist bots"
          ].join("\n")
        )
        .setFooter({ text: "🌺 Nancy RP • Security Core" });
      break;

    case "panel_outils":
      embed = new EmbedBuilder()
        .setColor("#8E44AD")
        .setTitle("🧰 Section Outils Staff")
        .setDescription(
          [
            "💠 **Outils :**",
            "> • /save",
            "> • /load",
            "> • /giveaway",
            "> • /help",
            "> • Panel staff"
          ].join("\n")
        )
        .setFooter({ text: "🌺 Nancy RP • Security Core" });
      break;
  }

  interaction.reply({ embeds: [embed], ephemeral: true });
});

// ======================================================
// 🔑 LOGIN FINAL
// ======================================================

client.login(process.env.TOKEN);



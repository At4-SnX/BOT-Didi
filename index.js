// ======================================================
// 🟣 BLOC 1 — IMPORTS & CONFIG GLOBALE
// ======================================================

require("dotenv").config();
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
// 🟣 CLIENT DISCORD
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

// OWNER
const OWNER_ID = "1472637775281918123";

// Rôles warns
const WARN_ROLE_1 = "1482533960557789214";
const WARN_ROLE_2 = "1482533960557789214";
const WARN_ROLE_3 = "1482533960557789214";

// Giveaway
const GIVEAWAY_ROLE_ID = "1482533960557789214";
const FOUNDATION_ROLE_ID = "1482533960557789214";

// Anti-bot
const BOT_WHITELIST = ["1472637775281918123"];

// Salon annonce RAID
const ANNOUNCE_CHANNEL_ID = "1472637775281918123";

// Couleurs embeds
const COLOR_SUCCESS = "#8E44AD";
const COLOR_ERROR = "#E74C3C";
const COLOR_INFO = "#3498DB";

// Footer
const FOOTER = { text: "🌺 Nancy RP • Security Core" };

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
// 🟣 CATÉGORIES TICKETS
// ======================================================

const categories = {
  "1488678969472454846": "report_staff",
  "1488679203590373557": "unban",
  "1488681903006421172": "partenariat",
  "1488681966990528593": "autre",
  "1488683247998079006": "report_joueur"
};

// ======================================================
// 🟣 FONCTIONS UTILITAIRES
// ======================================================

// Vérifier si owner
function isOwner(id) {
  return id === OWNER_ID;
}

// Vérifier si un membre peut lancer un giveaway
function canUseGiveaway(member) {
  return (
    member.roles.cache.has(GIVEAWAY_ROLE_ID) ||
    member.roles.cache.has(FOUNDATION_ROLE_ID) ||
    member.id === OWNER_ID
  );
}

// Lock des salons (RAID)
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

// Unlock des salons (UNRAID)
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

// Kick bots non whitelist
async function kickNonWhitelistedBots(guild) {
  const members = await guild.members.fetch();

  for (const [, member] of members) {
    if (member.user.bot && !BOT_WHITELIST.includes(member.id) && member.id !== client.user.id) {
      await member.kick("Raid Mode : bot non whitelist").catch(() => {});
    }
  }
}

// Snapshot serveur
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

// Restauration serveur
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
// 🟣 BLOC 2 — TICKETS (Messages esthétiques sans embeds)
// ======================================================

client.on("channelCreate", async (channel) => {
  // On attend 2 secondes pour laisser Discord créer le salon
  setTimeout(async () => {
    if (!channel.parentId) return;

    // On récupère le type de ticket selon la catégorie
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
// 🟣 BLOC 3 — COMMANDES PREFIX (UN SEUL EVENT)
// ======================================================

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const prefix = "n.";
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const cmd = args.shift()?.toLowerCase();

  // ======================================================
  // 🛡️ Vérification OWNER
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
  // 🟣 n.raid — Confirmation par boutons
  // ======================================================
  if (cmd === "raid") {
    const confirmEmbed = new EmbedBuilder()
      .setColor(COLOR_ERROR)
      .setTitle("⚠️ Confirmation RAID")
      .setDescription("Veux‑tu vraiment activer le RAID Mode ?")
      .setFooter(FOOTER);

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

    return message.channel.send({
      embeds: [confirmEmbed],
      components: [row]
    });
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
    return message.channel.send({ embeds: [embed] });
  }

  // ======================================================
  // 🤖 n.antibot on/off
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
// 🟣 BLOC 4 — ANTI-BOT (Kick automatique des bots non whitelist)
// ======================================================

client.on("guildMemberAdd", async (member) => {
  if (!member.guild) return;

  // Anti-bot activé ?
  const enabled = antiBotState.get(member.guild.id);
  if (!enabled) return;

  // Si ce n'est pas un bot → on ignore
  if (!member.user.bot) return;

  // Si bot whitelist → on ignore
  if (BOT_WHITELIST.includes(member.id)) return;

  // Si c'est le bot lui-même → on ignore
  if (member.id === client.user.id) return;

  // Sinon → kick automatique
  await member.kick("Anti-bot activé : bot non whitelist").catch(() => {});
});

// ======================================================
// 🟣 BLOC 5 — BOUTONS RAID (prefix + slash)
// ======================================================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const id = interaction.customId;

  // ======================================================
  // 🔥 RAID — Confirmation SLASH
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
  // 🔥 RAID — Confirmation PREFIX
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
// 🟣 BLOC 6 — COMMANDES SLASH
// ======================================================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = interaction.commandName;

  // Vérification staff pour les commandes modération
  const STAFF_ROLE_ID = "1482533960557789214";
  const isStaff = interaction.member.roles.cache.has(STAFF_ROLE_ID);

  // ======================================================
  // 🟣 /panel — Panel Staff (éphémère)
  // ======================================================
  if (cmd === "panel") {
    if (!isStaff) {
      return interaction.reply({
        content: "⛔ Tu n’as pas accès au panel staff.",
        ephemeral: true
      });
    }

    return sendStaffPanel(interaction, true);
  }

  // ======================================================
  // 🟣 /raid — Confirmation RAID (OWNER)
  // ======================================================
  if (cmd === "raid") {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          embedError("Accès refusé", "Commande réservée au propriétaire du bot.")
        ],
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(COLOR_ERROR)
      .setTitle("⚠️ Confirmation RAID")
      .setDescription("Veux‑tu vraiment activer le RAID Mode ?")
      .setFooter(FOOTER);

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

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  // ======================================================
  // 🔓 /unraid
  // ======================================================
  if (cmd === "unraid") {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          embedError("Accès refusé", "Commande réservée au propriétaire du bot.")
        ],
        ephemeral: true
      });
    }

    raidState.set(interaction.guild.id, { active: false });
    await unlockChannels(interaction.guild);

    return interaction.reply({
      embeds: [
        embedSuccess("RAID Mode désactivé", "🟣 Les salons ont été déverrouillés.")
      ],
      ephemeral: true
    });
  }

  // ======================================================
  // 🟡 /raidsim
  // ======================================================
  if (cmd === "raidsim") {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          embedError("Accès refusé", "Commande réservée au propriétaire du bot.")
        ],
        ephemeral: true
      });
    }

    const embed = embedRaidAlert(true);
    return interaction.reply({ embeds: [embed], ephemeral: false });
  }

  // ======================================================
  // 🤖 /antibot
  // ======================================================
  if (cmd === "antibot") {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          embedError("Accès refusé", "Commande réservée au propriétaire du bot.")
        ],
        ephemeral: true
      });
    }

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
  if (cmd === "save") {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          embedError("Accès refusé", "Commande réservée au propriétaire du bot.")
        ],
        ephemeral: true
      });
    }

    const snap = snapshotServer(interaction.guild);
    serverSaves.set(interaction.guild.id, snap);

    return interaction.reply({
      embeds: [
        embedSuccess("Sauvegarde effectuée", "🟣 La structure du serveur a été sauvegardée.")
      ],
      ephemeral: true
    });
  }

  // ======================================================
  // 💾 /load
  // ======================================================
  if (cmd === "load") {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          embedError("Accès refusé", "Commande réservée au propriétaire du bot.")
        ],
        ephemeral: true
      });
    }

    const snap = serverSaves.get(interaction.guild.id);

    if (!snap) {
      return interaction.reply({
        embeds: [
          embedError("Aucune sauvegarde", "Aucune sauvegarde n’a été trouvée.")
        ],
        ephemeral: true
      });
    }

    await restoreServer(interaction.guild, snap);

    return interaction.reply({
      embeds: [
        embedSuccess("Restauration terminée", "🟣 La structure du serveur a été restaurée.")
      ],
      ephemeral: true
    });
  }

  // ======================================================
  // 🎁 /giveaway
  // ======================================================
  if (cmd === "giveaway") {
    if (!canUseGiveaway(interaction.member)) {
      return interaction.reply({
        embeds: [
          embedError("Accès refusé", "Tu n’as pas les permissions pour lancer un giveaway.")
        ],
        ephemeral: true
      });
    }

    const durationMinutes = interaction.options.getInteger("durée");
    const prize = interaction.options.getString("récompense");

    if (durationMinutes <= 0) {
      return interaction.reply({
        embeds: [
          embedError("Durée invalide", "La durée doit être supérieure à 0.")
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

    // Timer fin
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
            embedError("Aucun participant", "Personne n’a participé au giveaway.")
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

  // ======================================================
  // 🟣 Commandes Modération (warn, unwarn, mute, kick, ban)
  // ======================================================

  if (!isStaff) return;

  // /warn
  if (cmd === "warn") {
    const user = interaction.options.getUser("membre");
    const reason = interaction.options.getString("raison") || "Aucune raison fournie";

    warns[user.id] = (warns[user.id] || 0) + 1;
    fs.writeFileSync("./warns.json", JSON.stringify(warns, null, 2));

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_INFO)
          .setTitle("⚠️ Avertissement appliqué")
          .setDescription(
            `👤 **Membre :** ${user}\n📝 **Raison :** ${reason}\n\nL’avertissement a été enregistré.`
          )
          .setFooter(FOOTER)
      ],
      ephemeral: true
    });
  }

  // /unwarn
  if (cmd === "unwarn") {
    const user = interaction.options.getUser("membre");
    const member = interaction.guild.members.cache.get(user.id);

    if (!warns[user.id] || warns[user.id] === 0) {
      return interaction.reply({
        content: "❌ Ce membre n’a aucun warn.",
        ephemeral: true
      });
    }

    warns[user.id]--;
    fs.writeFileSync("./warns.json", JSON.stringify(warns, null, 2));

    return interaction.reply({
      content: `✔️ Warn retiré à ${user}. Warns restants : **${warns[user.id]}**`,
      ephemeral: true
    });
  }

  // /warnings
  if (cmd === "warnings") {
    const user = interaction.options.getUser("membre");
    const count = warns[user.id] || 0;

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_INFO)
          .setTitle("📊 Historique des warns")
          .setDescription(
            `👤 **Membre :** ${user}\n🔢 **Warns :** ${count}\n\n${
              count === 0 ? "✔️ Aucun avertissement." : "📌 Warns enregistrés."
            }`
          )
          .setFooter(FOOTER)
      ],
      ephemeral: true
    });
  }

  // /kick
  if (cmd === "kick") {
    const member = interaction.options.getMember("membre");
    const reason = interaction.options.getString("raison") || "Aucune raison fournie";

    try {
      await member.kick(reason);
    } catch {
      return interaction.reply({
        content: "❌ Impossible de kick ce membre.",
        ephemeral: true
      });
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_ERROR)
          .setTitle("👢 Expulsion effectuée")
          .setDescription(`👤 **Membre :** ${member.user.tag}\n📝 **Raison :** ${reason}`)
          .setFooter(FOOTER)
      ],
      ephemeral: true
    });
  }

  // /ban
  if (cmd === "ban") {
    const user = interaction.options.getUser("membre");
    const reason = interaction.options.getString("raison") || "Aucune raison fournie";

    try {
      await interaction.guild.members.ban(user.id, { reason });
    } catch {
      return interaction.reply({
        content: "❌ Impossible de bannir ce membre.",
        ephemeral: true
      });
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_ERROR)
          .setTitle("🔨 Bannissement effectué")
          .setDescription(`👤 **Membre :** ${user.tag}\n📝 **Raison :** ${reason}`)
          .setFooter(FOOTER)
      ],
      ephemeral: true
    });
  }

  // /mute
  if (cmd === "mute") {
    const member = interaction.options.getMember("membre");
    const duration = interaction.options.getString("durée");
    const reason = interaction.options.getString("raison") || "Aucune raison fournie";

    const msDuration = ms(duration);
    if (!msDuration) {
      return interaction.reply({
        content: "⛔ Durée invalide. Exemple : `10m`, `1h`, `2d`",
        ephemeral: true
      });
    }

    try {
      await member.timeout(msDuration, reason);
    } catch {
      return interaction.reply({
        content: "❌ Impossible de mute ce membre.",
        ephemeral: true
      });
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_INFO)
          .setTitle("🔇 Mute appliqué")
          .setDescription(
            `👤 **Membre :** ${member}\n⏳ **Durée :** ${duration}\n📝 **Raison :** ${reason}`
          )
          .setFooter(FOOTER)
      ],
      ephemeral: true
    });
  }
});

// ======================================================
// 🟣 BLOC 7 — READY (Enregistrement des commandes slash)
// ======================================================

client.on("ready", async () => {
  console.log(`🟣 Connecté en tant que ${client.user.tag}`);

  // ID du serveur Nancy RP
  const guild = client.guilds.cache.get("1472637775281918123");
  if (!guild) {
    console.log("❌ Impossible de trouver le serveur Nancy RP.");
    return;
  }

  console.log("🟣 Enregistrement des commandes slash locales...");

  await guild.commands.set([
    // ======================================================
    // 🟣 Commandes générales
    // ======================================================
    {
      name: "help",
      description: "Affiche l'aide du bot Nancy RP"
    },
    {
      name: "panel",
      description: "Ouvre le panel staff"
    },

    // ======================================================
    // 🛡️ RAID
    // ======================================================
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

    // ======================================================
    // 🤖 Anti-bot
    // ======================================================
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

    // ======================================================
    // 💾 Sauvegarde / Restauration
    // ======================================================
    {
      name: "save",
      description: "Sauvegarde la structure du serveur (OWNER uniquement)"
    },
    {
      name: "load",
      description: "Restaure la dernière sauvegarde (OWNER uniquement)"
    },

    // ======================================================
    // 🎁 Giveaway
    // ======================================================
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

    // ======================================================
    // 🔧 Modération
    // ======================================================
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
  ]);

  console.log("🟣 Commandes slash LOCALES enregistrées (instantanées).");
});

// ======================================================
// 🟣 BLOC 8 — ARRIVÉES & DÉPARTS (Salons séparés + GIF + durée)
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
// 🔮 DÉPART D’UN MEMBRE (avec durée sur le serveur)
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
// 🔑 LOGIN FINAL
// ======================================================

client.login(process.env.TOKEN);



const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  ChannelType,
  EmbedBuilder,
  Collection
} = require("discord.js");

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

// ================== CONFIG NANCY RP ==================

const OWNER_ID = "1022469165824606258";
const ANNOUNCE_CHANNEL_ID = "1472639290163859638";
const GIVEAWAY_ROLE_ID = "1492873377017237618";
const FOUNDATION_ROLE_ID = "1472661671972442387";
const PREFIX = "n.";

// bots whitelist (à compléter si tu as d’autres bots)
const BOT_WHITELIST = []; // ex: ["123456789012345678"]

// tickets catégories
const categories = {
  "1488678969472454846": "report_staff",
  "1488679203590373557": "unban",
  "1488681903006421172": "partenariat",
  "1488681966990528593": "autre",
  "1488683247998079006": "report_joueur"
};

// états internes
const raidState = new Map();      // guildId -> { active: bool }
const antiBotState = new Map();   // guildId -> bool
const serverSaves = new Map();    // guildId -> snapshot structure
const giveaways = new Collection();

// ================== READY & SLASH COMMANDS ==================

client.on("ready", async () => {
  console.log(`Connecté en tant que ${client.user.tag}`);

  // Enregistrement des commandes slash (globales)
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

  console.log("Commandes slash enregistrées.");
});

// ================== TICKETS (TON CODE) ==================

client.on("channelCreate", (channel) => {
  console.log("Nouveau salon détecté :", channel.name, "parent:", channel.parentId);
});

client.on("channelCreate", async (channel) => {
  setTimeout(async () => {
    if (!channel.parentId) return;

    const type = categories[channel.parentId];
    if (!type) return;

    let message = "";

    switch (type) {
      case "report_staff":
        message = `:pushpin: **Ce formulaire est destiné aux joueurs souhaitant signaler un membre du staff.**
**Merci de remplir ce formulaire avec sérieux.**
**Les signalements abusifs ou incomplets ne seront pas traités.**

:bust_in_silhouette: **Identité du Staff (pseudo) : **
*(Nom du staff concerné)*

:clock3: **Date et heure du problème : **
*(Exemple : 15/03/2026 — 22h40)*

:round_pushpin: **Lieu ou contexte du problème : **
*(Exemple : scène en cours, intervention staff, ticket, vocal…)*

:page_facing_up: **Description complète du problème : **
*(Explique clairement ce qu’il s’est passé, les décisions prises, ton ressenti, etc.)*

:paperclip: **Preuves (screen, vidéo, logs) : **
*(Lien ou fichiers à joindre — obligatoire si possible)*`;
        break;

      case "unban":
        message = `:pushpin: **Vous avez ouvert ce ticket afin de faire une demande d’unban. Merci de fournir les informations nécessaires afin que votre requête soit étudiée.**

:bust_in_silhouette: **Identité (Pseudo IG / ID Roblox) : **
*(Votre nom en jeu et Identifiant Roblox)*

:clock3: **Date du bannissement : **
*(Indiquez la date approximative si vous ne vous en souvenez plus)*

:receipt: **Raison du bannissement (si connue) : **
*(Expliquez ce qui vous a été reproché)*

:pencil: **Pourquoi souhaitez-vous être unban ? **
*(Expliquez votre démarche, votre remise en question, et ce que vous comptez améliorer)*

:paperclip: **Éléments supplémentaires (optionnel) : **
*(Screens, explications, contexte…)*`;
        break;

      case "partenariat":
        message = `:pushpin: **Vous avez ouvert ce ticket afin de faire une demande de partenariat.**
**Merci de prendre connaissance des conditions ci-dessous avant de poursuivre.**

:bookmark_tabs: **Conditions de Partenariat — Nancy RP**

:white_check_mark: Conditions minimales :
- Le serveur doit compter au minimum 150 membres réels.
- Le serveur doit être actif.
- Présentation claire.
- Aucun contenu illégal ou NSFW.

:arrows_counterclockwise: Engagements attendus :
- Publication de notre annonce
- Ajout dans vos partenaires
- Respect des valeurs

:pencil: **Informations à fournir :**
:link: Lien du serveur
:busts_in_silhouette: Nombre de membres
:receipt: Présentation
:dart: Motivation
:mega: Engagements

:lock: **La Fondation analysera votre demande.**`;
        break;

      case "autre":
        message = `:pushpin: **Ce formulaire est destiné aux joueurs souhaitant faire une demande spéciale.**

:bust_in_silhouette: **Identité (Pseudo IG) : **
:id: **Identité Discord : **
:dart: **Nature de la demande : **
:pencil: **Description complète : **
:paperclip: **Documents : **
:speaking_head: **As-tu déjà discuté avec un staff ?**

:lock: **La Fondation reviendra vers toi.**`;
        break;

      case "report_joueur":
        message = `:pushpin: **Ce formulaire est destiné aux joueurs souhaitant signaler un autre joueur.**

:bust_in_silhouette: **Identité du joueur : **
:clock3: **Date et heure : **
:round_pushpin: **Lieu : **
:page_facing_up: **Description : **
:paperclip: **Preuves : **`;
        break;
    }

    if (message) {
      channel.send({
        content:
          message +
          "\nhttps://cdn.discordapp.com/attachments/1472650661685624852/1495404641515606126/NANCY_RP_4.gif"
      });
    }
  }, 2000);
});

// ================== UTILITAIRES ==================

function isOwner(userId) {
  return userId === OWNER_ID;
}

function canUseGiveaway(member) {
  return (
    member.roles.cache.has(GIVEAWAY_ROLE_ID) ||
    member.roles.cache.has(FOUNDATION_ROLE_ID) ||
    member.id === OWNER_ID
  );
}

async function sendRaidAlert(guild, simulation = false) {
  const channel = guild.channels.cache.get(ANNOUNCE_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(simulation ? 0xffc107 : 0xff0000)
    .setTitle(simulation ? "🔶 Simulation de Raid" : "🚨 RAID DÉTECTÉ")
    .setDescription(
      simulation
        ? "Ceci est **une simulation** de Raid pour test des procédures.\nAucune action réelle n'a été appliquée."
        : "Le **Raid Mode** a été activé.\nLes salons sont verrouillés, les bots non autorisés sont expulsés, et les actions sont limitées."
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] });
}

async function lockChannels(guild) {
  const everyoneRole = guild.roles.everyone;
  for (const [, channel] of guild.channels.cache) {
    if (!channel.isTextBased() && channel.type !== ChannelType.GuildCategory) continue;
    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: false,
      AddReactions: false,
      CreatePublicThreads: false,
      CreatePrivateThreads: false
    }).catch(() => {});
  }
}

async function unlockChannels(guild) {
  const everyoneRole = guild.roles.everyone;
  for (const [, channel] of guild.channels.cache) {
    if (!channel.isTextBased() && channel.type !== ChannelType.GuildCategory) continue;
    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: null,
      AddReactions: null,
      CreatePublicThreads: null,
      CreatePrivateThreads: null
    }).catch(() => {});
  }
}

async function kickNonWhitelistedBots(guild) {
  const members = await guild.members.fetch();
  for (const [, member] of members) {
    if (member.user.bot && !BOT_WHITELIST.includes(member.id) && member.id !== client.user.id) {
      await member.kick("Raid Mode: bot non whitelist").catch(() => {});
    }
  }
}

function snapshotServer(guild) {
  const data = {
    categories: [],
    channels: []
  };

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

  // On ne supprime rien, on recrée seulement ce qui manque
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

// ================== ANTI-BOT ==================

client.on("guildMemberAdd", async (member) => {
  if (!member.guild) return;
  const enabled = antiBotState.get(member.guild.id);
  if (!enabled) return;
  if (!member.user.bot) return;
  if (BOT_WHITELIST.includes(member.id)) return;
  if (member.id === client.user.id) return;

  await member.kick("Anti-bot activé : bot non whitelist").catch(() => {});
});

// ================== PREFIX COMMANDS ==================

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift()?.toLowerCase();

  // HELP
  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("📘 Aide Nancy RP")
      .setDescription(
        [
          "**Préfixe :** `n.`",
          "",
          "💠 **Protection & Raid**",
          "`n.raid` – Active le Raid Mode (OWNER)",
          "`n.unraid` – Désactive le Raid Mode (OWNER)",
          "`n.raidsim` – Simulation de Raid (OWNER)",
          "",
          "🤖 **Sécurité bots**",
          "`n.antibot on` – Active l’anti-bot (OWNER)",
          "`n.antibot off` – Désactive l’anti-bot (OWNER)",
          "",
          "💾 **Sauvegarde serveur**",
          "`n.save` – Sauvegarde la structure (OWNER)",
          "`n.load` – Restaure la dernière sauvegarde (OWNER)",
          "",
          "🎁 **Giveaway**",
          "Utilise `/giveaway` (Fondation + rôle giveaway)",
          "",
          "🔹 Version slash : `/help` pour la même liste."
        ].join("\n")
      );

    return message.channel.send({ embeds: [embed] });
  }

  // OWNER ONLY
  if (!isOwner(message.author.id)) {
    return message.reply("Cette commande est réservée au propriétaire du bot.").catch(() => {});
  }

  // RAID
  if (cmd === "raid") {
    raidState.set(message.guild.id, { active: true });
    await sendRaidAlert(message.guild, false);
    await lockChannels(message.guild);
    await kickNonWhitelistedBots(message.guild);
    return message.reply("Raid Mode activé : salons verrouillés, bots non whitelist expulsés.").catch(() => {});
  }

  if (cmd === "unraid") {
    raidState.set(message.guild.id, { active: false });
    await unlockChannels(message.guild);
    return message.reply("Raid Mode désactivé : salons déverrouillés.").catch(() => {});
  }

  if (cmd === "raidsim") {
    await sendRaidAlert(message.guild, true);
    return message.reply("Simulation de Raid envoyée dans le salon d'annonce.").catch(() => {});
  }

  // ANTIBOT
  if (cmd === "antibot") {
    const mode = (args[0] || "").toLowerCase();
    if (mode !== "on" && mode !== "off") {
      return message.reply("Utilisation : `n.antibot on` ou `n.antibot off`.").catch(() => {});
    }
    const enabled = mode === "on";
    antiBotState.set(message.guild.id, enabled);
    return message.reply(`Anti-bot ${enabled ? "activé" : "désactivé"}.`).catch(() => {});
  }

  // SAVE
  if (cmd === "save") {
    const snap = snapshotServer(message.guild);
    serverSaves.set(message.guild.id, snap);
    return message.reply("Structure du serveur sauvegardée.").catch(() => {});
  }

  // LOAD
  if (cmd === "load") {
    const snap = serverSaves.get(message.guild.id);
    if (!snap) {
      return message.reply("Aucune sauvegarde trouvée pour ce serveur.").catch(() => {});
    }
    await restoreServer(message.guild, snap);
    return message.reply("Restauration de la structure terminée (sans suppression).").catch(() => {});
  }
});

// ================== SLASH COMMANDS ==================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // /help
  if (commandName === "help") {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("📘 Aide Nancy RP")
      .setDescription(
        [
          "**Préfixe :** `n.`",
          "",
          "💠 **Protection & Raid**",
          "`/raid` – Active le Raid Mode (OWNER)",
          "`/unraid` – Désactive le Raid Mode (OWNER)",
          "`/raidsim` – Simulation de Raid (OWNER)",
          "",
          "🤖 **Sécurité bots**",
          "`/antibot mode:on/off` – Active/Désactive l’anti-bot (OWNER)",
          "",
          "💾 **Sauvegarde serveur**",
          "`/save` – Sauvegarde la structure (OWNER)",
          "`/load` – Restaure la dernière sauvegarde (OWNER)",
          "",
          "🎁 **Giveaway**",
          "`/giveaway durée:<minutes> récompense:<texte>` (Fondation + rôle giveaway)",
          "",
          "🔹 Version préfixe : `n.help`."
        ].join("\n")
      );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // OWNER ONLY COMMANDS
  if (["raid", "unraid", "raidsim", "antibot", "save", "load"].includes(commandName)) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        content: "Cette commande est réservée au propriétaire du bot.",
        ephemeral: true
      });
    }
  }

  if (commandName === "raid") {
    raidState.set(interaction.guild.id, { active: true });
    await sendRaidAlert(interaction.guild, false);
    await lockChannels(interaction.guild);
    await kickNonWhitelistedBots(interaction.guild);
    return interaction.reply("Raid Mode activé : salons verrouillés, bots non whitelist expulsés.");
  }

  if (commandName === "unraid") {
    raidState.set(interaction.guild.id, { active: false });
    await unlockChannels(interaction.guild);
    return interaction.reply("Raid Mode désactivé : salons déverrouillés.");
  }

  if (commandName === "raidsim") {
    await sendRaidAlert(interaction.guild, true);
    return interaction.reply("Simulation de Raid envoyée dans le salon d'annonce.");
  }

  if (commandName === "antibot") {
    const mode = interaction.options.getString("mode");
    const enabled = mode === "on";
    antiBotState.set(interaction.guild.id, enabled);
    return interaction.reply(`Anti-bot ${enabled ? "activé" : "désactivé"}.`);
  }

  if (commandName === "save") {
    const snap = snapshotServer(interaction.guild);
    serverSaves.set(interaction.guild.id, snap);
    return interaction.reply("Structure du serveur sauvegardée.");
  }

  if (commandName === "load") {
    const snap = serverSaves.get(interaction.guild.id);
    if (!snap) {
      return interaction.reply("Aucune sauvegarde trouvée pour ce serveur.");
    }
    await restoreServer(interaction.guild, snap);
    return interaction.reply("Restauration de la structure terminée (sans suppression).");
  }

  // GIVEAWAY
  if (commandName === "giveaway") {
    if (!canUseGiveaway(interaction.member)) {
      return interaction.reply({
        content: "Tu n'as pas les permissions pour lancer un giveaway.",
        ephemeral: true
      });
    }

    const durationMinutes = interaction.options.getInteger("durée");
    const prize = interaction.options.getString("récompense");

    if (durationMinutes <= 0) {
      return interaction.reply({
        content: "La durée doit être supérieure à 0.",
        ephemeral: true
      });
    }

    const endTime = Date.now() + durationMinutes * 60 * 1000;

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🎁 Giveaway")
      .setDescription(
        `Récompense : **${prize}**\nRéagis avec 🎉 pour participer !\nFin dans **${durationMinutes} minutes**.`
      )
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
        await channel.send("Personne n'a participé au giveaway.");
        giveaways.delete(msg.id);
        return;
      }

      const winner = participants.random();
      await channel.send(`🎉 Félicitations ${winner} ! Tu remportes **${data.prize}** !`);

      giveaways.delete(msg.id);
    }, durationMinutes * 60 * 1000);
  }
});

// ================== LOGIN ==================

client.login(process.env.TOKEN);


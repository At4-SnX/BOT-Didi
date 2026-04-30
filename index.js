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
const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: Object.values(GatewayIntentBits),
  partials: Object.values(Partials)
});

client.commands = new Collection();

require("./handlers/commandHandler")(client);
require("./handlers/eventHandler")(client);

client.login(process.env.TOKEN);


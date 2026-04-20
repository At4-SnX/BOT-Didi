const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// ⚙️ CONFIG (mets les IDs de TES catégories)
const categories = {
  "1488678969472454846": "report_staff",
  "1488679203590373557": "unban",
  "1488681903006421172": "partenariat",
  "1488681966990528593": "autre",
  "1488683247998079006": "report_joueur"
};

// 🎥 TON GIF (local ou lien)
const gif = "attachment://NANCY_RP_4.gif";

client.on("ready", () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
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
  content: message + "\nhttps://cdn.discordapp.com/attachments/1472650661685624852/1495404641515606126/NANCY_RP_4.gif?ex=69e6c859&is=69e576d9&hm=76a8bab945c34d323bc64caa14e11804dffef501ffac50f8215c2019a619874c&"
});
  }
  }, 4000);
});

client.login(process.env.TOKEN);
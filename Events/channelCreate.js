const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { premiumEmbed } = require("../utils/embed");

module.exports = {
  name: "channelCreate",

  async execute(channel) {

    setTimeout(async () => {
      if (!channel.parentId) return;

      const categories = {
        "1488678969472454846": "report_staff",
        "1488679203590373557": "unban",
        "1488681903006421172": "partenariat",
        "1488681966990528593": "autre",
        "1488683247998079006": "report_joueur",
        "1495810265474928732": "fondation"
      };

      const type = categories[channel.parentId];
      if (!type) return;

      let message = "";

      switch (type) {

        case "report_staff":
          message = `
🔷 **Signalement d'un membre du staff**

⚠️ Merci de fournir des informations complètes et sérieuses.

👤 **Staff concerné :**  
🕒 **Date & heure :**  
📍 **Contexte :**  
📝 **Description complète :**  
📎 **Preuves :**
`;
        break;

        case "unban":
          message = `
🟣 **Demande d'unban**

👤 **Identité (Pseudo + ID) :**  
📅 **Date du ban :**  
📜 **Raison :**  
🧠 **Pourquoi être unban ?**  
📎 **Informations supplémentaires :**
`;
        break;

        case "partenariat":
          message = `
🔷 **Demande de partenariat**

📌 **Conditions :**
✔️ +150 membres  
✔️ Serveur actif  
✔️ Présentation propre  

📊 **Infos à fournir :**
🔗 Lien  
👥 Membres  
📖 Présentation  
🎯 Motivation  
📢 Engagements
`;
        break;

        case "autre":
          message = `
🟣 **Demande générale**

👤 **Pseudo IG :**  
💬 **Discord :**  
🎯 **Type de demande :**  
📝 **Description :**  
📎 **Documents :**
`;
        break;

        case "report_joueur":
          message = `
🔷 **Signalement d'un joueur**

👤 **Joueur :**  
🕒 **Date :**  
📍 **Lieu :**  
📝 **Description :**  
📎 **Preuves :**
`;
        break;

        case "fondation":
          message = `
💠 **Demande Fondation — Nancy RP**

👤 **Identité :**  
🎮 Pseudo IG :  
💬 Discord :

🎯 **Type de demande :**

🧠 **Explication détaillée :**

📊 **Impact / utilité :**

📎 **Preuves :**

🗣️ **Contact staff déjà fait ?**

🌺 **La Fondation analysera ta demande.**
`;
        break;
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("copy_ticket")
          .setLabel("📋 Copier le formulaire")
          .setStyle(ButtonStyle.Primary)
      );

      await channel.send({
        embeds: [
          premiumEmbed({
            title: "🎫 Ticket ouvert",
            description: message,
            color: 0x6a5acd
          })
        ],
        components: [row]
      });

    }, 1500);
  }
};
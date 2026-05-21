const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        // Chemin vers la base de données (corrigé à la racine)
        const dbPath = path.join(__dirname, '../../database.json');
        let db = { raidMode: false, antibot: false };
        
        if (fs.existsSync(dbPath)) {
            db = JSON.parse(fs.readFileSync(dbPath));
        }

        // 1. Filtrage de sécurité Anti-Raid ou Anti-Bot
        if (db.raidMode || (db.antibot && member.user.bot)) {
            try {
                await member.kick('Nancy Protection : Mode Anti-Raid / Anti-Bot actif');
                if (typeof client.log === 'function') {
                    client.log(member.guild, 'EXPULSION SÉCURITÉ', `Le membre/bot **${member.user.tag}** (${member.id}) a été expulsé automatiquement.`);
                }
                return;
            } catch (e) { console.error(e); }
        }

        // 2. Récupération du salon de bienvenue
        const welcomeChannel = member.guild.channels.cache.get(client.config.welcomeChannel);
        if (!welcomeChannel) return console.log("⚠️ Salon de bienvenue introuvable. Vérifiez l'ID dans config.json");

        // Récupération du nombre total de membres sur le serveur
        const memberCount = member.guild.memberCount;

        // 3. Préparation du GIF d'arrivée (Chemin d'accès corrigé !)
        const gifPath = path.join(__dirname, '../../asset/NANCYRP.gif');
        const file = new AttachmentBuilder(gifPath, { name: 'welcome.gif' });

        // 4. Création de l'Embed de Bienvenue Premium
        const embed = new EmbedBuilder()
            .setTitle(`✨ Nouvelle Arrivée ! ✨`)
            .setDescription(
                `Bonjour ${member} et bienvenue sur **${member.guild.name}** !\n\n` +
                `Nous sommes ravis de t'accueillir parmi nous. Passe un excellent moment sur le serveur et n'hésite pas à poser tes questions si besoin.\n\n` +
                `📌 *Prends quelques secondes pour lire le règlement afin d'éviter les sanctions !*`
            )
            .setColor(client.config.color || '#5865F2')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setImage('attachment://welcome.gif')
            .setFooter({ text: `Membre #${memberCount} • Nancy ASSISTANCE`, iconURL: member.guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        // Envoi groupé
        welcomeChannel.send({ content: `👋 Bienvenue ${member} !`, embeds: [embed], files: [file] })
            .catch(err => console.error("Impossible d'envoyer le message d'arrivée:", err));
    },
};
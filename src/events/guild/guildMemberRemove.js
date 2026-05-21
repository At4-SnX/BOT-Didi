const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        // 1. Récupération du salon de départ ciblé par ID depuis la config
        const leaveChannel = member.guild.channels.cache.get(client.config.leaveChannel);
        if (!leaveChannel) return console.log("⚠️ Salon de départ introuvable. Vérifiez l'ID dans config.json");

        // 2. Préparation du GIF Local pour le départ
        // Assure-toi que le fichier est bien dans ton dossier "asset" à la racine
        const gifPath = path.join(__dirname, '../../../asset/LEAVERPM.gif');
        const file = new AttachmentBuilder(gifPath, { name: 'leave.gif' });

        // 3. Création de l'Embed
        const embed = new EmbedBuilder()
            .setTitle(`💔 Un membre nous a quittés`)
            .setDescription(`Au revoir **${member.user.username}**... Nous te souhaitons une bonne continuation pour la suite. 🫡`)
            .setColor('#ff4d4d') // Une couleur rouge/orange pour le départ, ou client.config.color si tu préfères
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setImage('attachment://leave.gif') // On affiche le fichier attaché
            .setTimestamp();

        // 4. Envoi de l'embed et du fichier
        leaveChannel.send({ embeds: [embed], files: [file] })
            .catch(err => console.error("Impossible d'envoyer le message de départ:", err));
    },
};
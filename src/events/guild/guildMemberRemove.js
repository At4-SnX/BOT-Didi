const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        // 1. Récupération du salon de départ
        const leaveChannel = member.guild.channels.cache.get(client.config.leaveChannel);
        if (!leaveChannel) return console.log("⚠️ Salon de départ introuvable. Vérifiez l'ID dans config.json");

        const memberCount = member.guild.memberCount;

        // 2. Préparation du GIF de départ (Chemin d'accès corrigé !)
        const gifPath = path.join(__dirname, '../../asset/LEAVERPM.gif');
        const file = new AttachmentBuilder(gifPath, { name: 'leave.gif' });

        // 3. Création de l'Embed de Départ Premium
        const embed = new EmbedBuilder()
            .setTitle(`🚪 Un départ à signaler...`)
            .setDescription(`**${member.user.username}** a quitté le serveur.\n\nMerci d'avoir fait un bout de chemin avec nous, et bonne continuation pour la suite ! 🫡`)
            .setColor('#FF4B4B')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setImage('attachment://leave.gif')
            .setFooter({ text: `Nous sommes désormais ${memberCount} membres • Nancy ASSISTANCE`, iconURL: member.guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        // Envoi groupé
        leaveChannel.send({ embeds: [embed], files: [file] })
            .catch(err => console.error("Impossible d'envoyer le message de départ:", err));
    },
};
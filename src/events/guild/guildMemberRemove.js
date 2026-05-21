const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        // Message de Départ ciblé par ID
        const leaveChannel = member.guild.channels.cache.get(client.config.leaveChannel);
        if (!leaveChannel) return console.log("⚠️ Salon de départ introuvable. Vérifiez l'ID dans config.json");

        const embed = new EmbedBuilder()
            .setTitle(`😢 Un départ...`)
            .setDescription(`**${member.user.tag}** vient de quitter le serveur. À bientôt peut-être !`)
            .setColor(client.config.color)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setImage(client.config.leaveGif)
            .setTimestamp();

        leaveChannel.send({ embeds: [embed] }).catch(err => console.error("Impossible d'envoyer le message de départ:", err));
    },
};
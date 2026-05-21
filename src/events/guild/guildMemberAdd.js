const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        const dbPath = path.join(__dirname, '../../../database.json');
        const db = JSON.parse(fs.readFileSync(dbPath));

        // 1. Filtrage de sécurité Anti-Raid ou Anti-Bot
        if (db.raidMode || (db.antibot && member.user.bot)) {
            try {
                await member.kick('Nancy Protection : Mode Anti-Raid / Anti-Bot actif');
                client.log(member.guild, 'EXPULSION SÉCURITÉ', `Le membre/bot **${member.user.tag}** (${member.id}) a été expulsé automatiquement.`);
                return;
            } catch (e) { console.error(e); }
        }

        // 2. Message de Bienvenue ciblé par ID
        const welcomeChannel = member.guild.channels.cache.get(client.config.welcomeChannel);
        if (!welcomeChannel) return console.log("⚠️ Salon de bienvenue introuvable. Vérifiez l'ID dans config.json");

        const embed = new EmbedBuilder()
            .setTitle(`👋 Bienvenue sur le serveur !`)
            .setDescription(`Bienvenue à toi ${member} ! Nous sommes ravis de te compter parmi nous.\n\n*N'oublie pas de jeter un œil au règlement !*`)
            .setColor(client.config.color)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setImage(client.config.welcomeGif)
            .setTimestamp();

        welcomeChannel.send({ embeds: [embed] }).catch(err => console.error("Impossible d'envoyer le message d'arrivée:", err));
    },
};
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        // ID de ton salon d'arrivée (Salon de bienvenue)
        const channelId = "1505943699748814878"; 
        const channel = member.guild.channels.cache.get(channelId);

        if (!channel) return;

        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`👋 Bienvenue sur Nancy RP !`)
            .setDescription(`Bonjour ${member} ! Nous sommes ravis de t'accueillir parmi nous.\n\n💼 **Nancy ASSISTANCE** et l'ensemble de la communauté te souhaitent une excellente intégration. Prépare ton plus beau rôleplay, l'aventure commence ici ! ✨`)
            .setColor("#5865F2")
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            // Ton GIF personnalisé en grand format
            .setImage("https://cdn.discordapp.com/attachments/1505943854250201118/1507075598021951508/NANCY_RP_5.gif?ex=6a109506&is=6a0f4386&hm=6939277976e0258d9492df40ca9a18992b2fbf60a9c1e39c1317a5e270655375&")
            .setFooter({ text: `Nancy ASSISTANCE • Nous sommes désormais ${member.guild.memberCount} citoyens !` })
            .setTimestamp();

        await channel.send({ content: `## 🎉 Un nouveau citoyen est arrivé ! \nBienvenue à toi ${member} !`, embeds: [welcomeEmbed] });
    }
};
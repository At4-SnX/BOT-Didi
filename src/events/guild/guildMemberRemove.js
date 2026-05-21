const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        // ID de ton salon de départ (Peut être le même ou un autre salon log/départ)
        const channelId = "1505943699748814878"; 
        const channel = member.guild.channels.cache.get(channelId);

        if (!channel) return;

        const leaveEmbed = new EmbedBuilder()
            .setTitle(`😢 Un citoyen nous quitte...`)
            .setDescription(`**${member.user.tag}** a pris ses bagages et vient de quitter le territoire de Nancy RP.\n\nToute l'équipe de **Nancy ASSISTANCE** lui souhaite une bonne continuation dans ses futurs projets. Sa carte de citoyen a été archivée. 🗃️`)
            .setColor("#FF3333")
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            // Le même GIF personnalisé en grand format
            .setImage("https://cdn.discordapp.com/attachments/1505943854250201118/1507075598021951508/NANCY_RP_5.gif?ex=6a109506&is=6a0f4386&hm=6939277976e0258d9492df40ca9a18992b2fbf60a9c1e39c1317a5e270655375&")
            .setFooter({ text: `Nancy ASSISTANCE • Il reste ${member.guild.memberCount} citoyens en ville.` })
            .setTimestamp();

        await channel.send({ embeds: [leaveEmbed] });
    }
};
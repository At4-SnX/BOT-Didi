const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Affiche le panel d\'administration du Staff')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('💻 PANEL ADMINISTRATIF | Nancy ASSISTANCE')
            .setDescription('Espace de contrôle global du serveur pour l\'équipe de direction.')
            .addFields(
                { name: '📈 État du Serveur', value: `Membres : **${interaction.guild.memberCount}**\nSalons : **${interaction.guild.channels.cache.size}**`, inline: true },
                { name: '⚡ Statut Protection', value: `Logs : <#${client.config.logChannel}>\nSystème Anti-Raid : En veille`, inline: true }
            )
            .setColor(client.config.color)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('save')
        .setDescription('Sauvegarde l\'architecture globale actuelle du serveur (Rôles, Catégories, Salons)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const backupData = { roles: [], categories: [], channels: [] };

        // Tri et nettoyage des rôles
        const roles = [...guild.roles.cache.values()].filter(r => r.name !== '@everyone' && !r.managed);
        roles.forEach(role => {
            backupData.roles.push({ name: role.name, color: role.color, permissions: role.permissions.bitfield.toString(), hoist: role.hoist });
        });

        // Extraction des salons et catégories
        const channels = [...guild.channels.cache.values()];
        
        channels.filter(c => c.type === ChannelType.GuildCategory).forEach(cat => {
            backupData.categories.push({ id: cat.id, name: cat.name, position: cat.position });
        });

        channels.filter(c => c.type !== ChannelType.GuildCategory).forEach(chan => {
            backupData.channels.push({
                name: chan.name,
                type: chan.type,
                parentName: chan.parent ? chan.parent.name : null,
                position: chan.position
            });
        });

        const backupsDir = path.join(__dirname, '../../../backups');
        if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

        fs.writeFileSync(path.join(backupsDir, `${guild.id}.json`), JSON.stringify(backupData, null, 4));
        return interaction.editReply('✅ La structure de votre serveur (Rôles, Catégories, Salons) a été enregistrée de manière sécurisée.');
    },
};
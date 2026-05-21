const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('load')
        .setDescription('⚠️ Supprime et recrée la structure du serveur à partir de la sauvegarde')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        const guild = interaction.guild;
        const backupPath = path.join(__dirname, `../../../backups/${guild.id}.json`);

        if (!fs.existsSync(backupPath)) {
            return interaction.reply({ content: '❌ Aucune sauvegarde trouvée pour ce serveur.', ephemeral: true });
        }

        await interaction.reply('⚠️ **Restauration en cours...** Nettoyage et recréation de l\'infrastructure...');

        const data = JSON.parse(fs.readFileSync(backupPath));

        // Étape 1 : Clear des salons actuels pour éviter les doublons (Sauf le salon courant temporairement)
        const currentChannels = [...guild.channels.cache.values()];
        for (const channel of currentChannels) {
            if (channel.id !== interaction.channelId) {
                await channel.delete().catch(() => {});
            }
        }

        // Étape 2 : Recréer les rôles
        for (const roleData of data.roles) {
            await guild.roles.create({ name: roleData.name, color: roleData.color, hoist: roleData.hoist }).catch(() => {});
        }

        // Étape 3 : Créer les Catégories
        const createdCategories = {};
        for (const cat of data.categories) {
            const newCat = await guild.channels.create({ name: cat.name, type: ChannelType.GuildCategory });
            createdCategories[cat.name] = newCat;
        }

        // Étape 4 : Créer les salons correspondants
        for (const chan of data.channels) {
            const parentChannel = chan.parentName ? createdCategories[chan.parentName] : null;
            await guild.channels.create({
                name: chan.name,
                type: chan.type,
                parent: parentChannel ? parentChannel.id : null
            }).catch(() => {});
        }

        // Suppression finale du salon initiateur s'il reste isolé
        try { await interaction.channel.delete(); } catch(e) {}
    },
};

async execute(interaction, client) {
    // TON ID DISCORD UNIQUE (Remplace les chiffres par ton vrai ID)
    const monIdUnique = "1022469165824606258"; 

    if (interaction.user.id !== monIdUnique) {
        return interaction.reply({ 
            content: "❌ **Sécurité Nancy :** Cette commande ultra-sensible est réservée exclusivement au Fondateur du serveur.", 
            ephemeral: true 
        });
    }

const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('raid')
        .setDescription('🛡️ Active le protocole d\'urgence Anti-Raid (Propriétaire uniquement)'),
    async execute(interaction, client) {
        if (interaction.user.id !== client.config.ownerId) {
            return interaction.reply({ content: '❌ Seul le propriétaire du bot peut activer le mode Anti-Raid.', ephemeral: true });
        }

        await interaction.deferReply();
        const dbPath = path.join(__dirname, '../../../database.json');
        const db = JSON.parse(fs.readFileSync(dbPath));
        db.raidMode = true;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));

        const channels = interaction.guild.channels.cache.filter(c => c.isTextBased());
        for (const [id, channel] of channels) {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false })
                .catch(() => {});
        }

        client.log(interaction.guild, '🔥 ALERTE RAID ACTIVÉE', `Le mode anti-raid a été déclenché par le Owner (**${interaction.user.tag}**).`);
        return interaction.editReply('🚨 **ALERTE RAID ACTIVÉE** : Le serveur est confiné.');
    },
};
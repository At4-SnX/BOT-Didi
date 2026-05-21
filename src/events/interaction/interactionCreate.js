const { InteractionType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Commande Slash
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'Une erreur est survenue lors de l\'exécution.', ephemeral: true });
                }
            }
        }
        
        // Bouton Giveaway
        if (interaction.isButton()) {
            if (interaction.customId.startsWith('giveaway_join_')) {
                const gwId = interaction.customId.replace('giveaway_join_', '');
                const dbPath = path.join(__dirname, '../../../database.json');
                const db = JSON.parse(fs.readFileSync(dbPath));
                
                if (!db.giveaways || !db.giveaways[gwId]) {
                    return interaction.reply({ content: '❌ Ce giveaway n\'existe plus.', ephemeral: true });
                }
                
                if (db.giveaways[gwId].participants.includes(interaction.user.id)) {
                    return interaction.reply({ content: '❌ Vous participez déjà à ce giveaway !', ephemeral: true });
                }
                
                db.giveaways[gwId].participants.push(interaction.user.id);
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));
                
                return interaction.reply({ content: '🎉 Votre participation a été enregistrée !', ephemeral: true });
            }
        }
    },
};
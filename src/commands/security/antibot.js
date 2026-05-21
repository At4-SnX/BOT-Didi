
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
        .setName('antibot')
        .setDescription('🛡️ Active/Désactive l\'anti-bot (Propriétaire uniquement)')
        .addStringOption(opt => opt.setName('mode').setDescription('ON ou OFF').setRequired(true).addChoices(
            { name: 'Activer (ON)', value: 'on' },
            { name: 'Désactiver (OFF)', value: 'off' }
        )),
    async execute(interaction, client) {
        if (interaction.user.id !== client.config.ownerId) {
            return interaction.reply({ content: '❌ Seul le propriétaire du bot peut configurer l\'Anti-Bot.', ephemeral: true });
        }

        const mode = interaction.options.getString('mode');
        const dbPath = path.join(__dirname, '../../../database.json');
        const db = JSON.parse(fs.readFileSync(dbPath));

        db.antibot = (mode === 'on');
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));

        client.log(interaction.guild, '⚙️ CONFIGURATION ANTI-BOT', `Filtrage mis sur **${mode.toUpperCase()}** par le Owner.`);
        return interaction.reply(`🤖 Le système Anti-Bot est désormais **${mode.toUpperCase()}**.`);
    },
};
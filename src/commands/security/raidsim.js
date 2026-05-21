const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('raidsim')
        .setDescription('🛡️ Simule une fausse alerte de raid (Propriétaire uniquement)'),
    async execute(interaction, client) {
        if (interaction.user.id !== client.config.ownerId) {
            return interaction.reply({ content: '❌ Seul le propriétaire du bot peut simuler un raid.', ephemeral: true });
        }

        client.log(interaction.guild, '⚠️ SIMULATION DE RAID', `Déclencheur initié par le Owner (**${interaction.user.tag}**).`, '#FFA500');
        return interaction.reply({ content: '🔔 Simulation envoyée dans les logs.', ephemeral: true });
    },
};
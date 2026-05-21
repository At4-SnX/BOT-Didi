const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche la liste des commandes de Nancy ASSISTANCE'),
    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('ℹ️ Aide - Nancy ASSISTANCE')
            .setDescription('Voici la liste complète des commandes triées par catégorie.')
            .setColor(client.config.color)
            .addFields(
                { name: '🛡️ Sécurité & Anti-Raid', value: '`/raid`, `/unraid`, `/raidsim`, `/antibot`' },
                { name: '🔨 Modération', value: '`/warn`, `/unwarn`, `/warnings`, `/mute`, `/kick`, `/ban`' },
                { name: '🎉 Animations', value: '`/giveaway`' },
                { name: '⚙️ Outils & Système', value: '`/panel`, `/save`, `/load`' }
            )
            .setFooter({ text: 'Nancy ASSISTANCE • Sécurité maximale' });

        return interaction.reply({ embeds: [embed] });
    },
};
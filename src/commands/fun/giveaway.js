const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Lance un tirage au sort automatique')
        .addStringOption(opt => opt.setName('prix').setDescription('Ce qu\'il y a à gagner').setRequired(true))
        .addStringOption(opt => opt.setName('durée').setDescription('Ex: 10m, 1h, 1d').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction, client) {
        const prize = interaction.options.getString('prix');
        const durationStr = interaction.options.getString('durée');
        const durationMs = ms(durationStr);

        if (!durationMs) return interaction.reply({ content: '❌ Format de temps invalide.', ephemeral: true });

        const endTime = Math.floor((Date.now() + durationMs) / 1000);
        const giveawayId = Math.random().toString(36).substring(2, 9);

        const embed = new EmbedBuilder()
            .setTitle('🎉 NOUVEAU GIVEAWAY 🎉')
            .setDescription(`Offert par : ${interaction.user}\n**Prix à gagner** : 🎁 __**${prize}**__\nFin du concours : <t:${endTime}:R>`)
            .setColor(client.config.color)
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`giveaway_join_${giveawayId}`)
                .setLabel('Participer !')
                .setEmoji('🎉')
                .setStyle(ButtonStyle.Primary)
        );

        const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        // Enregistrement en DB temporaire
        const dbPath = path.join(__dirname, '../../../database.json');
        const db = JSON.parse(fs.readFileSync(dbPath));
        if (!db.giveaways) db.giveaways = {};
        db.giveaways[giveawayId] = { participants: [] };
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));

        // Système d'attente asynchrone avant le tirage
        setTimeout(async () => {
            const currentDb = JSON.parse(fs.readFileSync(dbPath));
            const participants = currentDb.giveaways[giveawayId]?.participants || [];
            
            // Nettoyage de la base
            delete currentDb.giveaways[giveawayId];
            fs.writeFileSync(dbPath, JSON.stringify(currentDb, null, 4));

            if (participants.length === 0) {
                return msg.edit({ content: '❌ Aucun participant n\'a rejoint le giveaway, tirage annulé.', components: [] });
            }

            const winnerId = participants[Math.floor(Math.random() * participants.length)];
            
            const endEmbed = new EmbedBuilder()
                .setTitle('🎁 GIVEAWAY TERMINÉ 🎁')
                .setDescription(`**Prix** : ${prize}\nGagnant : <@${winnerId}> 🎉\nFélicitations !`)
                .setColor('#23272A');

            await msg.edit({ embeds: [endEmbed], components: [] });
            await msg.channel.send(`🎉 Félicitations à <@${winnerId}> qui remporte **${prize}** !`);

        }, durationMs);
    },
};
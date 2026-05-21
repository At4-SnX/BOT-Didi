const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Affiche la liste des avertissements d\'un membre')
        .addUserOption(opt => opt.setName('membre').setDescription('Le membre à vérifier').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction, client) {
        const user = interaction.options.getUser('membre');
        const dbPath = path.join(__dirname, '../../../database.json');
        const db = JSON.parse(fs.readFileSync(dbPath));

        const userWarns = db.warns[user.id] || [];
        if (userWarns.length === 0) return interaction.reply(`✅ **${user.tag}** n'a aucun avertissement.`);

        const embed = new EmbedBuilder()
            .setTitle(`Avertissements de ${user.tag}`)
            .setColor(client.config.color);

        userWarns.forEach((w, idx) => {
            embed.addFields({ name: `Warn n°${idx + 1} - ${w.date}`, value: `**Par** : ${w.moderator}\n**Raison** : ${w.reason}` });
        });

        return interaction.reply({ embeds: [embed] });
    },
};
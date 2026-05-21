const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Retire le dernier avertissement d\'un membre')
        .addUserOption(opt => opt.setName('membre').setDescription('Le membre concerné').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction, client) {
        const user = interaction.options.getUser('membre');
        const dbPath = path.join(__dirname, '../../../database.json');
        const db = JSON.parse(fs.readFileSync(dbPath));

        if (!db.warns[user.id] || db.warns[user.id].length === 0) {
            return interaction.reply({ content: '❌ Ce membre n\'a aucun avertissement actif.', ephemeral: true });
        }

        db.warns[user.id].pop();
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));

        return interaction.reply(`✅ Le dernier avertissement de **${user.tag}** a été retiré.`);
    },
};
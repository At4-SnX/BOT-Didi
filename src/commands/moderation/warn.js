const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Donne un avertissement à un membre')
        .addUserOption(opt => opt.setName('membre').setDescription('Le membre à avertir').setRequired(true))
        .addStringOption(opt => opt.setName('raison').setDescription('Raison de l\'avertissement').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction, client) {
        const user = interaction.options.getUser('membre');
        const reason = interaction.options.getString('raison');
        const dbPath = path.join(__dirname, '../../../database.json');
        const db = JSON.parse(fs.readFileSync(dbPath));

        if (!db.warns[user.id]) db.warns[user.id] = [];
        db.warns[user.id].push({ reason, moderator: interaction.user.tag, date: new Date().toLocaleDateString() });
        
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));

        client.log(interaction.guild, '🔨 MEMBRE WARN', `**Membre** : ${user.tag} (${user.id})\n**Modérateur** : ${interaction.user.tag}\n**Raison** : ${reason}`);
        return interaction.reply(`⚠️ **${user.tag}** a été averti pour : *${reason}*.`);
    },
};
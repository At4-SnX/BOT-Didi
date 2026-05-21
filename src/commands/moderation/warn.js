const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bannir un membre du serveur')
        // Permet au Staff ayant la permission de bannir de voir/utiliser la commande
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers), 

    async execute(interaction, client) {
        // Optionnel : Si tu veux aussi qu'un rôle nommé exactement "Staff" puisse l'utiliser 
        // même s'il n'a pas la permission brute de Discord, ajoute ceci :
        const hasStaffRole = interaction.member.roles.cache.some(role => role.name.toLowerCase() === 'staff');
        const hasPermission = interaction.member.permissions.has(PermissionFlagsBits.BanMembers);

        if (!hasPermission && !hasStaffRole) {
            return interaction.reply({ 
                content: "❌ Vous devez avoir le rôle **Staff** ou la permission requise pour effectuer une sanction.", 
                ephemeral: true 
            });
        }

        // LE RESTE DE TON CODE DE SANCTION...

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
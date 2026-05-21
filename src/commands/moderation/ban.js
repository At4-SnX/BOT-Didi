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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bannit définitivement un membre du serveur')
        .addUserOption(opt => opt.setName('membre').setDescription('Le membre à bannir').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction, client) {
        const user = interaction.options.getUser('membre');
        
        try {
            await interaction.guild.members.ban(user, { reason: `Banni par ${interaction.user.tag}` });
            client.log(interaction.guild, '🔴 BANNI', `**User** : ${user.tag}\n**Modérateur** : ${interaction.user.tag}`);
            return interaction.reply(`🔴 **${user.tag}** a été banni définitivement du serveur.`);
        } catch (e) {
            return interaction.reply('❌ Impossible de bannir cet utilisateur. Vérifiez ma hiérarchie.');
        }
    },
};
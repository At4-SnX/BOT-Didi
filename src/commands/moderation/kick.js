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
        .setName('kick')
        .setDescription('Expulse un membre du serveur')
        .addUserOption(opt => opt.setName('membre').setDescription('Le membre à exclure').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction, client) {
        const member = interaction.options.getMember('membre');
        if (!member) return interaction.reply('❌ Membre introuvable.');

        if (!member.kickable) return interaction.reply('❌ Mes permissions ou ma hiérarchie de rôles m\'empêchent d\'expulser cette personne.');

        await member.kick(`Expulsé par ${interaction.user.tag}`);
        client.log(interaction.guild, '🥾 EXPULSION', `**Membre** : ${member.user.tag}\n**Modérateur** : ${interaction.user.tag}`);
        return interaction.reply(`🥾 **${member.user.tag}** a été expulsé.`);
    },
};
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
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Exclut temporairement un membre (Timeout)')
        .addUserOption(opt => opt.setName('membre').setDescription('Membre à mute').setRequired(true))
        .addStringOption(opt => opt.setName('temps').setDescription('Ex: 10m, 1h, 1d').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction, client) {
        const member = interaction.options.getMember('membre');
        const durationStr = interaction.options.getString('temps');

        if (!member) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
        
        const timeMs = ms(durationStr);
        if (!timeMs || timeMs > 2419200000) { // Max 28 jours imposé par Discord
            return interaction.reply({ content: '❌ Durée invalide (maximum 28j, format: 10m, 2h, 5d).', ephemeral: true });
        }

        await member.timeout(timeMs, `Par ${interaction.user.tag}`);
        client.log(interaction.guild, '🔇 EN CAS DE MUTE', `**Membre** : ${member.user.tag}\n**Durée** : ${durationStr}\n**Modérateur** : ${interaction.user.tag}`);
        return interaction.reply(`🔇 **${member.user.tag}** a été rendu muet pendant **${durationStr}**.`);
    },
};
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
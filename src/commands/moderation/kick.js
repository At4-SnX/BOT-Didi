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
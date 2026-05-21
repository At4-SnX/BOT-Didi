const { REST, Routes } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`✅ ${client.user.tag} est en ligne et opérationnel !`);
        
        const commands = [];
        client.commands.forEach(cmd => commands.push(cmd.data.toJSON()));

        const rest = new REST({ version: '10' }).setToken(client.config.token);

        try {
            console.log('🔄 Actualisation des commandes Slash (/) applicatives...');
            await rest.put(
                Routes.applicationGuildCommands(client.config.clientId, client.config.guildId),
                { body: commands },
            );
            console.log('✅ Commandes Slash (/) enregistrées avec succès !');
        } catch (error) {
            console.error(error);
        }
    },
};
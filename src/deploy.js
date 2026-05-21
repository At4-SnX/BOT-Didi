const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

const commands = [];
// On va chercher la commande dans le dossier admin où on l'a rangée
const commandsPath = path.join(__dirname, 'commands', 'admin');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    }
}

// Préparation du système de déploiement de Discord
const rest = new REST().setToken(config.token);

(async () => {
    try {
        console.log(`⏳ Rafraîchissement des commandes Slash (/) ...`);

        // Cette ligne enregistre de force la commande auprès de Discord sur TOUS tes serveurs
        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands },
        );

        console.log(`✅ Les commandes Slash ont été enregistrées avec succès auprès de Discord !`);
    } catch (error) {
        console.error(error);
    }
})();
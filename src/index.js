const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 1. Gestion adaptative : Charge le config.json en local, ou les variables Railway en ligne
let config = {};
if (fs.existsSync(path.join(__dirname, '../config.json'))) {
    config = require('../config.json');
} else {
    config = {
        token: process.env.TOKEN,
        clientId: process.env.CLIENT_ID,
        guildId: process.env.GUILD_ID,
        ownerId: process.env.OWNER_ID,
        color: "#237feb",
        logChannel: process.env.LOG_CHANNEL,
        welcomeChannel: process.env.WELCOME_CHANNEL,
        leaveChannel: process.env.LEAVE_CHANNEL,
        welcomeGif: "https://cdn.discordapp.com/attachments/1505943852291330098/1507037974703902780/NANCY_RP_6.gif?ex=6a1071fc&is=6a0f207c&hm=131264ddd0f9ae4d71a1f3b3152aec5ff0ad523fda9c045234b1ffc0d17a3977&",
        leaveGif: "https://cdn.discordapp.com/attachments/1505943852291330098/1507037974703902780/NANCY_RP_6.gif?ex=6a1071fc&is=6a0f207c&hm=131264ddd0f9ae4d71a1f3b3152aec5ff0ad523fda9c045234b1ffc0d17a3977&"
    };
}

// 2. Initialisation du Client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.GuildMember]
});

client.commands = new Collection();
client.config = config;

// 3. Initialisation de la mini DB locale (gérée par Railway ou en local)
const dbPath = path.join(__dirname, '../database.json');
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ warns: {}, antibot: false, raidMode: false, giveaways: {} }, null, 4));
}

// 4. Handler de commandes (lecture automatique des dossiers)
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);
for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }
}

// 5. Handler d'événements
const eventsPath = path.join(__dirname, 'events');
const eventFolders = fs.readdirSync(eventsPath);
for (const folder of eventFolders) {
    const folderPath = path.join(eventsPath, folder);
    const eventFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(folderPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}

// 6. Système de logs global
client.log = async (guild, title, description, color = config.color) => {
    const logChannel = guild.channels.cache.get(config.logChannel);
    if (!logChannel) return;
    const embed = new EmbedBuilder()
        .setTitle(`🛡️ Nancy Logs | ${title}`)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();
    try { logChannel.send({ embeds: [embed] }); } catch (e) { console.error(e); }
};

// 7. Connexion du bot
client.login(config.token);
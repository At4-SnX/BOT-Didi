const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 1. Gestion adaptative de la configuration (Local vs Railway)
let config = {};
const localConfigPath = path.join(__dirname, '../config.json');

if (fs.existsSync(localConfigPath)) {
    config = require(localConfigPath);
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
        welcomeGif: "https://cdn.discordapp.com/attachments/1505943854250201118/1507075598021951508/NANCY_RP_5.gif?ex=6a109506&is=6a0f4386&hm=6939277976e0258d9492df40ca9a18992b2fbf60a9c1e39c1317a5e270655375&",
        leaveGif: "https://cdn.discordapp.com/attachments/1505943854250201118/1507075598021951508/NANCY_RP_5.gif?ex=6a109506&is=6a0f4386&hm=6939277976e0258d9492df40ca9a18992b2fbf60a9c1e39c1317a5e270655375&"
    };
}

// 2. Initialisation du Client Discord (Une seule fois, avec les bons Intents)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,    // Absolument requis pour détecter arrivées/départs
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.GuildMember]
});

client.commands = new Collection();
client.config = config;

// 3. Initialisation de la mini DB locale
const dbPath = path.join(__dirname, '../database.json');
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ warns: {}, antibot: false, raidMode: false, giveaways: {} }, null, 4));
}

// 4. Handler de commandes (Lecture par sous-dossiers : admin, fun, etc.)
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFolders = fs.readdirSync(commandsPath);
    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        // On s'assure que c'est bien un dossier avant de le lire
        if (fs.lstatSync(folderPath).isDirectory()) {
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                }
            }
        }
    }
}

// 5. Handler d'événements (Lecture directe des fichiers dans src/events/)
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
    console.log(`✅ [Nancy] ${eventFiles.length} événements système chargés avec succès.`);
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

// ==================== SYSTÈME D'ARRIVÉE ET DÉPART FORCÉ ====================
client.on('guildMemberAdd', async (member) => {
    const channelId = "1505943699748814878"; // ID de ton salon d'arrivée
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setTitle(`👋 Bienvenue sur Nancy RP !`)
        .setDescription(`Bonjour ${member} ! Nous sommes ravis de t'accueillir parmi nous.\n\n💼 **Nancy ASSISTANCE** et l'ensemble de la communauté te souhaitent une excellente intégration. Prépare ton plus beau rôleplay, l'aventure commence ici ! ✨`)
        .setColor("#5865F2")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setImage("https://cdn.discordapp.com/attachments/1505943854250201118/1507075598021951508/NANCY_RP_5.gif?ex=6a109506&is=6a0f4386&hm=6939277976e0258d9492df40ca9a18992b2fbf60a9c1e39c1317a5e270655375&")
        .setFooter({ text: `Nancy ASSISTANCE • Nous sommes désormais ${member.guild.memberCount} citoyens !` })
        .setTimestamp();

    await channel.send({ content: `## 🎉 Un nouveau citoyen est arrivé ! \nBienvenue à toi ${member} !`, embeds: [welcomeEmbed] }).catch(console.error);
});

client.on('guildMemberRemove', async (member) => {
    const channelId = "1505943699748814878"; // ID de ton salon de départ
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const leaveEmbed = new EmbedBuilder()
        .setTitle(`😢 Un citoyen nous quitte...`)
        .setDescription(`**${member.user.tag}** a pris ses bagages et vient de quitter le territoire de Nancy RP.\n\nToute l'équipe de **Nancy ASSISTANCE** lui souhaite une bonne continuation dans ses futurs projets. Sa carte de citoyen a été archivée. 🗃️`)
        .setColor("#FF3333")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setImage("https://cdn.discordapp.com/attachments/1505943854250201118/1507075598021951508/NANCY_RP_5.gif?ex=6a109506&is=6a0f4386&hm=6939277976e0258d9492df40ca9a18992b2fbf60a9c1e39c1317a5e270655375&")
        .setFooter({ text: `Nancy ASSISTANCE • Il reste ${member.guild.memberCount} citoyens en ville.` })
        .setTimestamp();

    await channel.send({ embeds: [leaveEmbed] }).catch(console.error);
});
// ===========================================================================
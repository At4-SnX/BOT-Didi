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

// On s'assure d'importer Canvas tout en haut ou juste ici
const Canvas = require('canvas');

// ==================== SYSTÈME DE BIENVENUE CANVAS ====================
client.on("guildMemberAdd", async (member) => {
    const channelId = "1505943699748814878"; // Ton salon d'arrivée
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    try {
        const canvas = Canvas.createCanvas(900, 300);
        const ctx = canvas.getContext("2d");

        // Chargement du fond depuis ton lien Imgur direct
        const background = await Canvas.loadImage("https://i.imgur.com/yo7PUTc.png");
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        // Chargement et découpe de l'avatar en cercle
        const avatar = await Canvas.loadImage(
            member.user.displayAvatarURL({ extension: "png", size: 256 })
        );

        ctx.save();
        ctx.beginPath();
        ctx.arc(150, 150, 100, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 50, 50, 200, 200);
        ctx.restore();

        // Ajout des textes
        ctx.fillStyle = "#ffffff";
        ctx.font = "40px sans-serif"; // "sans-serif" évite les bugs si Poppins n'est pas installée sur Railway
        ctx.fillText("Bienvenue sur Nancy RP", 300, 140);

        ctx.font = "30px sans-serif";
        ctx.fillText(member.user.username, 300, 200);

        const attachment = canvas.toBuffer();

        const embed = new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle("🌺 Nouveau membre")
            .setDescription(`Bienvenue à **${member}** sur Nancy RP !\nNous sommes maintenant **${member.guild.memberCount}** citoyens. ✨`)
            .setImage("attachment://welcome.png")
            .setFooter({ text: "Nancy ASSISTANCE" })
            .setTimestamp();

        await channel.send({ 
            embeds: [embed], 
            files: [{ attachment: attachment, name: "welcome.png" }] 
        });

    } catch (error) {
        console.error("Erreur Canvas Arrivée :", error);
    }
});

// ==================== SYSTÈME DE DÉPART CANVAS ====================
client.on("guildMemberRemove", async (member) => {
    const channelId = "1505943699748814878"; // Ton salon de départ
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    try {
        const canvas = Canvas.createCanvas(900, 300);
        const ctx = canvas.getContext("2d");

        // Même fond Imgur
        const background = await Canvas.loadImage("https://i.imgur.com/yo7PUTc.png");
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        const avatar = await Canvas.loadImage(
            member.user.displayAvatarURL({ extension: "png", size: 256 })
        );

        ctx.save();
        ctx.beginPath();
        ctx.arc(150, 150, 100, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 50, 50, 200, 200);
        ctx.restore();

        ctx.fillStyle = "#ffffff";
        ctx.font = "40px sans-serif";
        ctx.fillText("Un membre nous quitte…", 300, 140);

        ctx.font = "30px sans-serif";
        ctx.fillText(member.user.username, 300, 200);

        const attachment = canvas.toBuffer();

        const embed = new EmbedBuilder()
            .setColor("#FF3333")
            .setTitle("💨 Départ d’un membre")
            .setDescription(`**${member.user.username}** a quitté Nancy RP.\nIl reste **${member.guild.memberCount}** citoyens en ville. 🗃️`)
            .setImage("attachment://leave.png")
            .setFooter({ text: "Nancy ASSISTANCE" })
            .setTimestamp();

        await channel.send({ 
            embeds: [embed], 
            files: [{ attachment: attachment, name: "leave.png" }] 
        });

    } catch (error) {
        console.error("Erreur Canvas Départ :", error);
    }
});
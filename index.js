const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  ChannelType,
  EmbedBuilder,
  Collection,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const client = new Client({
  intents: Object.values(GatewayIntentBits),
  partials: Object.values(Partials)
});

// ================= CONFIG =================

const OWNER_ID = "1022469165824606258";
const ANNOUNCE_CHANNEL_ID = "1472639290163859638";
const LOG_CHANNEL_ID = "ID_LOGS";
const PREFIX = "n.";

const WARN_ROLES = [
  "1472675083339169813",
  "1472675086741012637",
  "1472675097771774104"
];

const BOT_WHITELIST = [];

const categories = {
  "1488678969472454846": "report_staff",
  "1488679203590373557": "unban",
  "1488681903006421172": "partenariat",
  "1488681966990528593": "autre",
  "1488683247998079006": "report_joueur"
};

// ================= STATE =================

const raidState = new Map();
const antiBotState = new Map();
const serverSaves = new Map();
const giveaways = new Collection();
const joinTracker = new Map();
const spamTracker = new Map();

// ================= EMBED =================

function premiumEmbed({ title, description, color = 0x5865f2 }) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`💠 ${title}`)
    .setDescription(description)
    .setFooter({ text: "🌺 Nancy RP • Security Core" })
    .setTimestamp();
}

// ================= LOG =================

async function sendLog(guild, embed) {
  const ch = guild.channels.cache.get(LOG_CHANNEL_ID);
  if (ch) ch.send({ embeds: [embed] }).catch(() => {});
}

// ================= RAID =================

async function sendRaidDMAll(guild) {
  const channel = guild.systemChannel || guild.channels.cache.find(c => c.isTextBased());
  if (!channel) return;

  const invite = await channel.createInvite({ maxAge: 0 }).catch(() => null);
  if (!invite) return;

  const members = await guild.members.fetch();

  for (const [, m] of members) {
    if (m.user.bot) continue;

    m.send({
      embeds: [
        premiumEmbed({
          title: "🚨 Raid détecté",
          description: `Rejoins ici si kick : ${invite.url}`,
          color: 0xff0000
        })
      ]
    }).catch(() => {});
  }
}

// ================= ANTI RAID =================

const RAID_THRESHOLD = 5;
const RAID_INTERVAL = 10000;

client.on("guildMemberAdd", async (member) => {
  const id = member.guild.id;

  if (!joinTracker.has(id)) joinTracker.set(id, []);

  const now = Date.now();
  const joins = joinTracker.get(id).filter(t => now - t < RAID_INTERVAL);

  joins.push(now);
  joinTracker.set(id, joins);

  if (joins.length >= RAID_THRESHOLD) {
    if (raidState.get(id)?.active) return;

    raidState.set(id, { active: true });

    await sendRaidDMAll(member.guild);

    await sendLog(member.guild, premiumEmbed({
      title: "🚨 Raid détecté",
      description: "Activation automatique"
    }));
  }
});

// ================= ANTI SPAM =================

client.on("messageCreate", async (msg) => {
  if (!msg.guild || msg.author.bot) return;

  const id = msg.author.id;

  if (!spamTracker.has(id)) spamTracker.set(id, []);

  const now = Date.now();
  const msgs = spamTracker.get(id).filter(t => now - t < 5000);

  msgs.push(now);
  spamTracker.set(id, msgs);

  if (msgs.length >= 5) {
    await msg.delete().catch(() => {});
    await msg.member.timeout(5000).catch(() => {});

    await sendLog(msg.guild, premiumEmbed({
      title: "🧠 Anti-spam",
      description: `${msg.author} spam détecté`
    }));
  }
});

// ================= TICKETS =================

client.on("channelCreate", async (channel) => {
  setTimeout(async () => {
    if (!channel.parentId) return;

    const type = categories[channel.parentId];
    if (!type) return;

    let message = "Formulaire...";

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("copy_form")
        .setLabel("📋 Copier")
        .setStyle(ButtonStyle.Primary)
    );

    channel.send({
      embeds: [premiumEmbed({ title: "Ticket", description: message })],
      components: [row]
    });
  }, 1500);
});

// ================= PANEL STAFF =================

client.on("messageCreate", async (msg) => {
  if (!msg.content.startsWith(PREFIX) || msg.author.bot) return;

  const cmd = msg.content.slice(PREFIX.length);

  if (cmd === "panel") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("warn").setLabel("⚠️").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("mute").setLabel("🔇").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("kick").setLabel("👢").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("ban").setLabel("🔨").setStyle(ButtonStyle.Danger)
    );

    msg.channel.send({
      embeds: [premiumEmbed({ title: "Panel Staff", description: "Actions rapides" })],
      components: [row]
    });
  }
});

// ================= INTERACTIONS =================

client.on("interactionCreate", async (i) => {
  if (i.isButton()) {

    if (i.customId === "copy_form") {
      return i.reply({ content: "📋 Formulaire copié", ephemeral: true });
    }

    await i.reply({ content: "Mention utilisateur", ephemeral: true });

    const filter = m => m.author.id === i.user.id;

    const collected = await i.channel.awaitMessages({ filter, max: 1, time: 15000 });
    const msg = collected.first();
    if (!msg) return;

    const member = msg.mentions.members.first();
    if (!member) return;

    // WARN
    if (i.customId === "warn") {
      let count = WARN_ROLES.filter(r => member.roles.cache.has(r)).length;

      if (count < 3) {
        await member.roles.add(WARN_ROLES[count]);
      }

      await sendLog(member.guild, premiumEmbed({
        title: "Warn",
        description: `${member} → ${count + 1}/3`
      }));
    }

    // MUTE
    if (i.customId === "mute") {
      await member.timeout(600000).catch(() => {});
    }

    // KICK
    if (i.customId === "kick") {
      await member.kick().catch(() => {});
    }

    // BAN
    if (i.customId === "ban") {
      await member.ban().catch(() => {});
    }
  }
});

// ================= LOGIN =================

client.login(process.env.TOKEN);



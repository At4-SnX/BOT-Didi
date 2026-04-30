const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require("discord.js");
const fs = require("fs");

// ====== CONFIG ======
const LOG_CHANNEL = "1499125248191103066";
const RAID_ROLE = "1472950794495201427";

const WARN_1 = "1472675083339169813";
const WARN_2 = "1472675086741012637";
const WARN_3 = "1472675097771774104";

const FOOTER = "🌺 Nancy RP • Security core";
const WARN_FILE = "./warns.json";
const WARN_LIFETIME = 7 * 24 * 60 * 60 * 1000; // 7 jours

// ====== CHARGEMENT DES WARNS ======
let warns = {};
if (fs.existsSync(WARN_FILE)) {
  try {
    warns = JSON.parse(fs.readFileSync(WARN_FILE, "utf8"));
  } catch {
    warns = {};
  }
}

function saveWarns() {
  fs.writeFileSync(WARN_FILE, JSON.stringify(warns, null, 4));
}

// Retourne les warns actifs (non expirés)
function getActiveWarns(userId) {
  const now = Date.now();
  if (!warns[userId]) return [];

  const filtered = warns[userId].filter(ts => now - ts < WARN_LIFETIME);
  warns[userId] = filtered;
  saveWarns();
  return filtered;
}

// Met à jour les rôles selon le niveau de warn
async function updateWarnRoles(member) {
  const active = getActiveWarns(member.id);
  const count = active.length;

  const rolesToRemove = [WARN_1, WARN_2, WARN_3];
  try {
    await member.roles.remove(rolesToRemove.filter(r => member.roles.cache.has(r)));
  } catch {}

  let roleToAdd = null;
  if (count === 1) roleToAdd = WARN_1;
  else if (count === 2) roleToAdd = WARN_2;
  else if (count >= 3) roleToAdd = WARN_3;

  if (roleToAdd) {
    try {
      await member.roles.add(roleToAdd);
    } catch {}
  }

  return count;
}

// Anti-abus warn (détection de spam)
const modWarnHistory = new Map(); // modId -> timestamps

function registerModWarn(modId) {
  const now = Date.now();
  if (!modWarnHistory.has(modId)) modWarnHistory.set(modId, []);
  const arr = modWarnHistory.get(modId).filter(ts => now - ts < 60 * 1000);
  arr.push(now);
  modWarnHistory.set(modId, arr);
  return arr.length;
}

// ====== CLIENT ======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// ====== COMMANDES SLASH ======
client.on("ready", async () => {
  const commands = [
    new SlashCommandBuilder()
      .setName("warn")
      .setDescription("🌺 Ajouter un avertissement à un utilisateur")
      .addUserOption(o =>
        o.setName("utilisateur")
          .setDescription("Utilisateur à avertir")
          .setRequired(true)
      )
      .addStringOption(o =>
        o.setName("raison")
          .setDescription("Raison du warn")
          .setRequired(false)
      ),

    new SlashCommandBuilder()
      .setName("unwarn")
      .setDescription("🔮 Retirer un avertissement à un utilisateur")
      .addUserOption(o =>
        o.setName("utilisateur")
          .setDescription("Utilisateur à unwarn")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("warnings")
      .setDescription("💠 Voir les avertissements d’un utilisateur")
      .addUserOption(o =>
        o.setName("utilisateur")
          .setDescription("Utilisateur à consulter")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("raid")
      .setDescription("🌺 Activer le mode RAID"),

    new SlashCommandBuilder()
      .setName("unraid")
      .setDescription("💠 Désactiver le mode RAID"),

    new SlashCommandBuilder()
      .setName("staffpanel")
      .setDescription("🔮 Ouvrir le panneau staff premium")
  ];

  await client.application.commands.set(commands);
  console.log("🌺 Commandes chargées.");
});

// ====== INTERACTIONS ======
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  const member = interaction.member;
  const isStaff = member.permissions.has(PermissionsBitField.Flags.KickMembers);

  // /warn
  if (commandName === "warn") {
    if (!isStaff)
      return interaction.reply({ content: "Permission refusée.", ephemeral: true });

    const target = interaction.options.getMember("utilisateur");
    const reason = interaction.options.getString("raison") || "Aucune raison fournie";

    if (!target)
      return interaction.reply({ content: "Utilisateur introuvable.", ephemeral: true });

    const now = Date.now();
    if (!warns[target.id]) warns[target.id] = [];
    warns[target.id].push(now);
    saveWarns();

    const count = await updateWarnRoles(target);

    const modCount = registerModWarn(interaction.user.id);
    if (modCount >= 5) {
      const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL);
      if (logChannel) {
        const abuseEmbed = new EmbedBuilder()
          .setColor("#E056FD")
          .setTitle("🌺・Alerte Anti-Abus — Warn Spam")
          .setDescription(
            "Un modérateur a émis un nombre anormalement élevé de warns en moins d’une minute."
          )
          .addFields(
            { name: "🔮 Modérateur", value: interaction.user.tag },
            { name: "💠 Warns (1 min)", value: `${modCount}` }
          )
          .setFooter({ text: FOOTER })
          .setTimestamp();
        logChannel.send({ embeds: [abuseEmbed] });
      }
    }

    const embedUser = new EmbedBuilder()
      .setColor("#9B59B6")
      .setTitle("🌺・Avertissement Appliqué")
      .setDescription(
        `Un avertissement a été appliqué à **${target.user.tag}**.\n\n` +
        `🔮 **Raison :** ${reason}\n` +
        `💠 **Niveau actuel :** ${count}/3`
      )
      .setFooter({ text: FOOTER })
      .setTimestamp();

    const embedLog = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🌺・Nouveau Warn")
      .addFields(
        { name: "🔵 Utilisateur", value: `${target.user.tag} (${target.id})` },
        { name: "🔮 Niveau", value: `${count}/3` },
        { name: "🌺 Raison", value: reason },
        { name: "💠 Modérateur", value: interaction.user.tag }
      )
      .setFooter({ text: FOOTER })
      .setTimestamp();

    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL);
    if (logChannel) logChannel.send({ embeds: [embedLog] });

    return interaction.reply({ embeds: [embedUser], ephemeral: true });
  }

  // /unwarn
  if (commandName === "unwarn") {
    if (!isStaff)
      return interaction.reply({ content: "Permission refusée.", ephemeral: true });

    const target = interaction.options.getMember("utilisateur");
    if (!target)
      return interaction.reply({ content: "Utilisateur introuvable.", ephemeral: true });

    const active = getActiveWarns(target.id);
    if (active.length === 0)
      return interaction.reply({ content: "Aucun warn actif.", ephemeral: true });

    active.pop();
    warns[target.id] = active;
    saveWarns();

    const count = await updateWarnRoles(target);

    const embed = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle("💠・Avertissement Retiré")
      .setDescription(
        `Un avertissement a été retiré pour **${target.user.tag}**.\n` +
        `🔮 **Warn restants :** ${count}/3`
      )
      .setFooter({ text: FOOTER })
      .setTimestamp();

    const logEmbed = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle("🌺・Unwarn Effectué")
      .addFields(
        { name: "🔵 Utilisateur", value: `${target.user.tag}` },
        { name: "💠 Warn restants", value: `${count}/3` },
        { name: "🔮 Modérateur", value: interaction.user.tag }
      )
      .setFooter({ text: FOOTER })
      .setTimestamp();

    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL);
    if (logChannel) logChannel.send({ embeds: [logEmbed] });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // /warnings
  if (commandName === "warnings") {
    if (!isStaff)
      return interaction.reply({ content: "Permission refusée.", ephemeral: true });

    const target = interaction.options.getMember("utilisateur");
    if (!target)
      return interaction.reply({ content: "Utilisateur introuvable.", ephemeral: true });

    const active = getActiveWarns(target.id);
    const count = active.length;

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🔮・Historique des Avertissements")
      .setDescription(
        `Voici les avertissements **actifs** pour **${target.user.tag}**.\n` +
        `Expiration automatique : **7 jours**.`
      )
      .addFields({ name: "💠 Warns actifs", value: `${count}` })
      .setFooter({ text: FOOTER })
      .setTimestamp();

    if (count > 0) {
      embed.addFields({
        name: "🌺 Détails",
        value: active
          .map((ts, i) => `<t:${Math.floor(ts / 1000)}:f>`)
          .join("\n")
      });
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // /raid
  if (commandName === "raid") {
    if (!isStaff)
      return interaction.reply({ content: "Permission refusée.", ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🌺・RAID MODE ACTIVÉ")
      .setDescription(
        "Le système de sécurité **Nancy RP Premium** a activé le **Raid Mode**.\n\n" +
        "🔮 Mesures actives :\n" +
        "• Surveillance renforcée\n" +
        "• Analyse des comportements suspects\n" +
        "• Coordination staff recommandée\n"
      )
      .setFooter({ text: FOOTER })
      .setTimestamp();

    return interaction.reply({
      content: `<@&${RAID_ROLE}>`,
      embeds: [embed]
    });
  }

  // /unraid
  if (commandName === "unraid") {
    if (!isStaff)
      return interaction.reply({ content: "Permission refusée.", ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle("💠・Raid Mode Désactivé")
      .setDescription("Le serveur repasse en mode normal.")
      .setFooter({ text: FOOTER })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  // /staffpanel
  if (commandName === "staffpanel") {
    if (!isStaff)
      return interaction.reply({ content: "Permission refusée.", ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor("#9B59B6")
      .setTitle("🔮・Panneau Staff Premium")
      .setDescription(
        "Bienvenue dans le **panneau staff premium**.\n\n" +
        "🌺 **Commandes disponibles :**\n" +
        "• `/warn`\n" +
        "• `/unwarn`\n" +
        "• `/warnings`\n" +
        "• `/raid`\n" +
        "• `/unraid`\n\n" +
        "Expiration automatique des warns : **7 jours**."
      )
      .setFooter({ text: FOOTER })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("copy_form")
        .setLabel("📋 Copier modèle warn")
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
});

// Bouton "copier le formulaire"
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "copy_form") return;

  const content =
    "🌺 **Modèle de warn Nancy RP**\n\n" +
    "• Utilisateur : @pseudo\n" +
    "• Raison : \n" +
    "• Niveau : 1 / 2 / 3\n" +
    "• Modérateur : \n";

  await interaction.reply({
    content: "Le modèle t’a été envoyé en DM.",
    ephemeral: true
  });

  try {
    await interaction.user.send({ content });
  } catch {}
});

// LOGIN
client.login("TON_TOKEN_ICI");



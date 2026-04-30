if (interaction.isButton()) {
  if (interaction.customId === "copy_ticket") {
    const embed = interaction.message.embeds[0];

    return interaction.reply({
      content: `📋 **Formulaire :**\n\n${embed.description}`,
      ephemeral: true
    });
  }
}

const giveaways = require("../utils/giveawayStore");

if (interaction.isButton()) {

  const data = giveaways.get(interaction.message.id);
  if (!data) return;

  // 🎉 PARTICIPER
  if (interaction.customId === "join_giveaway") {

    if (data.participants.includes(interaction.user.id)) {
      return interaction.reply({
        content: "❌ Tu participes déjà.",
        ephemeral: true
      });
    }

    data.participants.push(interaction.user.id);

    return interaction.reply({
      content: "✅ Tu participes au giveaway !",
      ephemeral: true
    });
  }

  // 📋 LISTE
  if (interaction.customId === "list_giveaway") {

    if (!data.participants.length) {
      return interaction.reply({
        content: "❌ Aucun participant.",
        ephemeral: true
      });
    }

    const list = data.participants
      .map(id => `<@${id}>`)
      .slice(0, 50)
      .join("\n");

    return interaction.reply({
      content: `📋 **Participants :**\n${list}`,
      ephemeral: true
    });
  }
}

const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

const { logWarn, logKick, logBan } = require("../utils/logger");
const { addWarn } = require("../utils/warnSystem");

const WARN_ROLES = [
  "1472675083339169813",
  "1472675086741012637",
  "1472675097771774104"
];

// ================= MENU =================

if (interaction.isStringSelectMenu()) {

  if (interaction.customId === "panel_action") {

    const action = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`panel_modal_${action}`)
      .setTitle(`Action: ${action}`);

    const userInput = new TextInputBuilder()
      .setCustomId("user_id")
      .setLabel("ID de l'utilisateur")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const reasonInput = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Raison")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(userInput),
      new ActionRowBuilder().addComponents(reasonInput)
    );

    return interaction.showModal(modal);
  }
}

// ================= MODAL =================

if (interaction.isModalSubmit()) {

  if (!interaction.customId.startsWith("panel_modal_")) return;

  if (!interaction.member.permissions.has("ModerateMembers")) {
    return interaction.reply({ content: "❌ Permission refusée.", ephemeral: true });
  }

  const action = interaction.customId.replace("panel_modal_", "");

  const userId = interaction.fields.getTextInputValue("user_id");
  const reason = interaction.fields.getTextInputValue("reason") || "Aucune raison";

  const member = await interaction.guild.members.fetch(userId).catch(() => null);

  if (!member) {
    return interaction.reply({ content: "❌ Utilisateur introuvable.", ephemeral: true });
  }

  // ================= ACTIONS =================

  if (action === "warn") {

    let count = WARN_ROLES.filter(r => member.roles.cache.has(r)).length;

    if (count >= 3) {
      return interaction.reply({ content: "❌ Déjà 3 warns.", ephemeral: true });
    }

    await member.roles.add(WARN_ROLES[count]);

    addWarn(member.id, {
      reason,
      author: interaction.user.id,
      date: new Date().toISOString()
    });

    logWarn(interaction.guild, member, interaction.user, reason, count + 1);

    return interaction.reply(`⚠️ ${member} warn (${count + 1}/3)`);
  }

  if (action === "kick") {

    await member.kick(reason).catch(() => {});
    logKick(interaction.guild, member, interaction.user, reason);

    return interaction.reply(`👢 ${member.user.tag} kick.`);
  }

  if (action === "ban") {

    await member.ban({ reason }).catch(() => {});
    logBan(interaction.guild, member.user, interaction.user, reason);

    return interaction.reply(`🔨 ${member.user.tag} ban.`);
  }

  if (action === "mute") {

    await member.timeout(10 * 60 * 1000, reason).catch(() => {});

    return interaction.reply(`🔇 ${member.user.tag} mute 10 min.`);
  }
}
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('annonce')
        .setDescription('Gestion des annonces de Nancy ASSISTANCE')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('compteur')
                .setDescription('Lance le compte à rebours jusqu\'au 22 mai à 18h')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('maintenance')
                .setDescription('Signale une fonctionnalité Hors Service')
                .addStringOption(option => 
                    option.setName('fonctionnalite')
                        .setDescription('Le nom de la fonctionnalité HS (ex: Système de tickets)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('raison')
                        .setDescription('La raison de la panne ou détails supplémentaires')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('en_ligne')
                .setDescription('Annonce le retour en ligne d\'une fonctionnalité')
                .addStringOption(option => 
                    option.setName('fonctionnalite')
                        .setDescription('Le nom de la fonctionnalité réparée')
                        .setRequired(true)
                )
        ),

    async execute(interaction, client) {
        const targetChannelId = "1505943699748814878";
        const channel = interaction.guild.channels.cache.get(targetChannelId);

        if (!channel) {
            return interaction.reply({ content: `❌ Salon d'annonce introuvable.`, ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        // 1. LE COMPTE À REBOURS
        if (subcommand === 'compteur') {
            const targetDate = new Date('2026-05-22T18:00:00+02:00').getTime();
            await interaction.reply({ content: `⏳ Lancement du compte à rebours...`, ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle("⏳ [ANNONCE] Événement Imminent !")
                .setColor(client.config.color || '#5865F2')
                .setDescription("Calcul du temps restant...")
                .setTimestamp();

            const message = await channel.send({ embeds: [embed] });

            const interval = setInterval(async () => {
                const now = new Date().getTime();
                const timeLeft = targetDate - now;

                if (timeLeft <= 0) {
                    clearInterval(interval);
                    const endEmbed = new EmbedBuilder()
                        .setTitle("🎉 C'EST L'HEURE !")
                        .setDescription("L'attente est terminée. L'événement commence maintenant ! 🚀")
                        .setColor("#00FF00")
                        .setTimestamp();
                    await message.edit({ embeds: [endEmbed] }).catch(() => clearInterval(interval));
                    return;
                }

                const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

                const updateEmbed = new EmbedBuilder()
                    .setTitle("⏳ [ANNONCE] Compte à rebours lancé !")
                    .setDescription(`L'événement approche à grands pas !\n\n⏱️ **Temps restant :**\n\`${days} jours, ${hours} heures, ${minutes} minutes et ${seconds} secondes\``)
                    .setColor(client.config.color || '#5865F2')
                    .setFooter({ text: "Nancy ASSISTANCE" });

                await message.edit({ embeds: [updateEmbed] }).catch(() => clearInterval(interval));
            }, 2000);
        }

        // 2. EMBED HORS SERVICE
        if (subcommand === 'maintenance') {
            const funcName = interaction.options.getString('fonctionnalite');
            const reason = interaction.options.getString('raison') || "Nos équipes sont actuellement en train de résoudre le problème. Merci de votre patience.";

            const maintEmbed = new EmbedBuilder()
                .setTitle("⚠️ [ALERTE] Fonctionnalité Hors Service")
                .setDescription(`Une de nos fonctionnalités rencontre actuellement des perturbations importantes.`)
                .addFields(
                    { name: "🛠️ Fonctionnalité touchée :", value: `\`${funcName}\``, inline: false },
                    { name: "📝 Statut / Détails :", value: reason, inline: false }
                )
                .setColor("#FF3333")
                .setFooter({ text: "Nancy ASSISTANCE • Maintenance" })
                .setTimestamp();

            await channel.send({ embeds: [maintEmbed] });
            await interaction.reply({ content: `✅ Alerte HS envoyée.`, ephemeral: true });
        }

        // 3. EMBED RETOUR EN LIGNE
        if (subcommand === 'en_ligne') {
            const funcName = interaction.options.getString('fonctionnalite');

            const onlineEmbed = new EmbedBuilder()
                .setTitle("✅ [STABLE] Fonctionnalité Opérationnelle")
                .setDescription(`Bonne nouvelle ! L'incident est désormais terminé.`)
                .addFields(
                    { name: "🚀 Fonctionnalité rétablie :", value: `\`${funcName}\``, inline: false },
                    { name: "💚 Statut :", value: "Le système est à nouveau 100% fonctionnel et stable. Merci de votre attente !", inline: false }
                )
                .setColor("#00FF00") // Vert opérationnel
                .setFooter({ text: "Nancy ASSISTANCE • Système Réparé" })
                .setTimestamp();

            await channel.send({ embeds: [onlineEmbed] });
            await interaction.reply({ content: `✅ Annonce de retour en ligne envoyée.`, ephemeral: true });
        }
    }
};
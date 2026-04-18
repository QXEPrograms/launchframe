import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { Embeds, Colors } from '../utils/embeds';
import { DataManager } from '../utils/dataManager';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(o => o.setName('user').setDescription('The user to warn').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the warning').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);

    const warning = DataManager.addWarning(interaction.guild.id, target.id, reason, interaction.user.id);
    const allWarnings = DataManager.getWarnings(interaction.guild.id, target.id);

    try {
      await target.send({
        embeds: [new EmbedBuilder()
          .setColor(Colors.warning)
          .setTitle('⚠️  You have received a warning')
          .setDescription(`You were warned in **${interaction.guild.name}**.`)
          .addFields(
            { name: 'Reason', value: reason },
            { name: 'Total Warnings', value: `${allWarnings.length}`, inline: true },
            { name: 'Warning ID', value: `\`${warning.id.slice(0, 8)}\``, inline: true }
          )
          .setTimestamp()],
      });
    } catch { /* DMs disabled */ }

    await interaction.reply({
      embeds: [Embeds.success(
        'Warning Issued',
        `<@${target.id}> now has **${allWarnings.length}** warning(s).\n**Reason:** ${reason}\n**ID:** \`${warning.id.slice(0, 8)}\``
      )],
    });

    const logId = process.env.MOD_LOG_CHANNEL_ID;
    if (logId) {
      const logCh = interaction.guild.channels.cache.get(logId) as TextChannel | undefined;
      await logCh?.send({
        embeds: [Embeds.modAction(
          'Warn', `<@${target.id}> (${target.tag})`, `<@${interaction.user.id}>`, reason,
          { 'Total Warnings': `${allWarnings.length}` }
        )],
      });
    }
  },
};

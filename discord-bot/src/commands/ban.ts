import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { Embeds, Colors } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(o => o.setName('user').setDescription('The user to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the ban').setRequired(false))
    .addIntegerOption(o =>
      o.setName('days').setDescription('Days of messages to delete (0–7)').setMinValue(0).setMaxValue(7).setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    const days = interaction.options.getInteger('days') ?? 0;

    if (target.id === interaction.user.id) {
      return interaction.reply({ embeds: [Embeds.error('Invalid Target', "You can't ban yourself.")], ephemeral: true });
    }
    if (target.id === interaction.client.user?.id) {
      return interaction.reply({ embeds: [Embeds.error('Invalid Target', "I can't ban myself.")], ephemeral: true });
    }

    const member = interaction.guild.members.cache.get(target.id);
    if (member && !member.bannable) {
      return interaction.reply({
        embeds: [Embeds.error('Cannot Ban', 'This user has higher permissions than me.')],
        ephemeral: true,
      });
    }

    // DM the user before banning
    try {
      await target.send({
        embeds: [new EmbedBuilder()
          .setColor(Colors.error)
          .setTitle('🔨  You have been banned')
          .setDescription(`You were banned from **${interaction.guild.name}**.`)
          .addFields({ name: 'Reason', value: reason })
          .setTimestamp()],
      });
    } catch { /* DMs disabled */ }

    await interaction.guild.members.ban(target.id, { reason, deleteMessageSeconds: days * 86400 });

    await interaction.reply({
      embeds: [Embeds.success('User Banned', `**${target.tag}** has been banned.\n**Reason:** ${reason}`)],
    });

    const logId = process.env.MOD_LOG_CHANNEL_ID;
    if (logId) {
      const logCh = interaction.guild.channels.cache.get(logId) as TextChannel | undefined;
      await logCh?.send({
        embeds: [Embeds.modAction('Ban', `<@${target.id}> (${target.tag})`, `<@${interaction.user.id}>`, reason)],
      });
    }
  },
};

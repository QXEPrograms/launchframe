import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { Embeds, Colors } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(o => o.setName('user').setDescription('The user to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the kick').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    const member = interaction.guild.members.cache.get(target.id);
    if (!member) {
      return interaction.reply({ embeds: [Embeds.error('User Not Found', 'That user is not in this server.')], ephemeral: true });
    }
    if (!member.kickable) {
      return interaction.reply({ embeds: [Embeds.error('Cannot Kick', 'This user has higher permissions than me.')], ephemeral: true });
    }

    try {
      await target.send({
        embeds: [new EmbedBuilder()
          .setColor(Colors.warning)
          .setTitle('👢  You have been kicked')
          .setDescription(`You were kicked from **${interaction.guild.name}**.`)
          .addFields({ name: 'Reason', value: reason })
          .setTimestamp()],
      });
    } catch { /* DMs disabled */ }

    await member.kick(reason);

    await interaction.reply({
      embeds: [Embeds.success('User Kicked', `**${target.tag}** has been kicked.\n**Reason:** ${reason}`)],
    });

    const logId = process.env.MOD_LOG_CHANNEL_ID;
    if (logId) {
      const logCh = interaction.guild.channels.cache.get(logId) as TextChannel | undefined;
      await logCh?.send({
        embeds: [Embeds.modAction('Kick', `<@${target.id}> (${target.tag})`, `<@${interaction.user.id}>`, reason)],
      });
    }
  },
};

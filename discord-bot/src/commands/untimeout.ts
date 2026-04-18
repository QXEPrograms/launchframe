import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { Command } from '../types';
import { Embeds } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove a timeout from a member')
    .addUserOption(o => o.setName('user').setDescription('The user to un-timeout').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    const member = interaction.guild.members.cache.get(target.id);
    if (!member) {
      return interaction.reply({ embeds: [Embeds.error('User Not Found', 'That user is not in this server.')], ephemeral: true });
    }
    if (!member.isCommunicationDisabled()) {
      return interaction.reply({ embeds: [Embeds.info('Not Timed Out', 'This user is not currently timed out.')], ephemeral: true });
    }

    await member.timeout(null, reason);

    await interaction.reply({
      embeds: [Embeds.success('Timeout Removed', `**${target.tag}**'s timeout has been lifted.`)],
    });

    const logId = process.env.MOD_LOG_CHANNEL_ID;
    if (logId) {
      const logCh = interaction.guild.channels.cache.get(logId) as TextChannel | undefined;
      await logCh?.send({
        embeds: [Embeds.modAction('Untimeout', `<@${target.id}> (${target.tag})`, `<@${interaction.user.id}>`, reason)],
      });
    }
  },
};

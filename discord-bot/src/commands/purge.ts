import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { Command } from '../types';
import { Embeds } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages from a channel')
    .addIntegerOption(o =>
      o.setName('amount').setDescription('Number of messages to delete (1–100)').setMinValue(1).setMaxValue(100).setRequired(true)
    )
    .addUserOption(o => o.setName('user').setDescription('Only delete messages from this user').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('amount', true);
    const filterUser = interaction.options.getUser('user');
    const channel = interaction.channel as TextChannel;

    await interaction.deferReply({ ephemeral: true });

    let messages = await channel.messages.fetch({ limit: 100 });

    // Filter to last 14 days (Discord limitation)
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    messages = messages.filter(m => m.createdTimestamp > cutoff);

    if (filterUser) messages = messages.filter(m => m.author.id === filterUser.id);

    const toDelete = [...messages.values()].slice(0, amount);
    const deleted = await channel.bulkDelete(toDelete, true);

    const logId = process.env.MOD_LOG_CHANNEL_ID;
    if (logId) {
      const logCh = interaction.guild?.channels.cache.get(logId) as TextChannel | undefined;
      await logCh?.send({
        embeds: [Embeds.modAction(
          'Message Purge',
          filterUser ? `<@${filterUser.id}>` : `<#${channel.id}>`,
          `<@${interaction.user.id}>`,
          `Deleted ${deleted.size} message(s)${filterUser ? ` from ${filterUser.tag}` : ''}`
        )],
      });
    }

    await interaction.editReply({
      embeds: [Embeds.success('Messages Purged', `Deleted **${deleted.size}** message(s).`)],
    });
  },
};

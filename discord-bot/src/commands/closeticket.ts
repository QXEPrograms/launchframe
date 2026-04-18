import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { Command } from '../types';
import { Embeds } from '../utils/embeds';
import { TicketManager } from '../utils/ticketManager';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('closeticket')
    .setDescription('Force close the current ticket channel')
    .addStringOption(o => o.setName('reason').setDescription('Reason for closing').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const record = TicketManager.getTicketByChannel(interaction.guild.id, interaction.channelId);
    if (!record) {
      return interaction.reply({
        embeds: [Embeds.error('Not a Ticket', 'This command only works inside a ticket channel.')],
        ephemeral: true,
      });
    }

    const reason = interaction.options.getString('reason') ?? 'Closed by moderator';
    const ticketNum = String(record.number).padStart(4, '0');

    await interaction.reply({
      embeds: [Embeds.warning(`Closing Ticket #${ticketNum}`, `Channel deletes in **5 seconds**.\n**Reason:** ${reason}`)],
    });

    TicketManager.closeTicket(interaction.guild.id, interaction.channelId);

    const logId = process.env.MOD_LOG_CHANNEL_ID;
    if (logId) {
      const logCh = interaction.guild.channels.cache.get(logId) as TextChannel | undefined;
      await logCh?.send({
        embeds: [Embeds.modAction(
          'Ticket Closed',
          `<@${record.userId}> (${record.username})`,
          `<@${interaction.user.id}>`,
          reason,
          { 'Ticket': `#${ticketNum}` }
        )],
      });
    }

    setTimeout(async () => {
      try { await (interaction.channel as TextChannel).delete(`Ticket closed: ${reason}`); } catch {}
    }, 5_000);
  },
};

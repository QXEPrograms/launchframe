import {
  Client, Interaction, TextChannel,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionFlagsBits, OverwriteResolvable,
} from 'discord.js';
import { Embeds, Colors } from '../utils/embeds';
import { logger } from '../utils/logger';
import { isOwner } from '../utils/permissions';
import { TicketManager } from '../utils/ticketManager';

export function setupInteractionCreate(client: Client): void {
  client.on('interactionCreate', async (interaction: Interaction) => {

    // ── Slash commands ─────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      logger.command(interaction.commandName, interaction.user.tag, interaction.guild?.name ?? 'DM');

      if (!isOwner(interaction.user.id)) {
        await interaction.reply({
          embeds: [Embeds.error('Access Denied', 'Only the bot owner can use this command.')],
          ephemeral: true,
        });
        return;
      }

      try {
        await command.execute(interaction);
      } catch (err) {
        logger.error(`Error running /${interaction.commandName}`, err);
        const embed = Embeds.error('Command Error', 'Something went wrong. Check the console for details.');
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [embed], ephemeral: true });
        } else {
          await interaction.reply({ embeds: [embed], ephemeral: true });
        }
      }
      return;
    }

    // ── Button interactions ────────────────────────────────
    if (!interaction.isButton()) return;
    const { customId, guild, user } = interaction;
    if (!guild) return;

    // ── Open ticket ────────────────────────────────────────
    if (customId === 'ticket_open') {
      try {
        await interaction.deferReply({ ephemeral: true });

        // Block duplicate open tickets
        const existingId = TicketManager.getUserTicketChannel(guild.id, user.id);
        if (existingId) {
          const still = guild.channels.cache.has(existingId);
          if (still) {
            return interaction.editReply({
              embeds: [Embeds.warning('Already Open', `You already have a ticket open: <#${existingId}>`)],
            });
          }
          // Channel deleted externally — clean up stale record
          TicketManager.closeTicket(guild.id, existingId);
        }

        const config = TicketManager.getConfig(guild.id);

        const overwrites: OverwriteResolvable[] = [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          {
            id: user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          },
          {
            id: client.user!.id,
            allow: [
              PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ];

        if (process.env.OWNER_ID) {
          overwrites.push({
            id: process.env.OWNER_ID,
            allow: [
              PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory,
            ],
          });
        }

        if (config.supportRoleId) {
          overwrites.push({
            id: config.supportRoleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          });
        }

        const safeName = user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'user';

        const ticketChannel = await guild.channels.create({
          name: `ticket-${safeName}`,
          type: ChannelType.GuildText,
          parent: config.categoryId ?? undefined,
          permissionOverwrites: overwrites,
          topic: `Support ticket for ${user.tag} (${user.id})`,
        });

        const record = TicketManager.openTicket(guild.id, ticketChannel.id, user.id, user.tag);
        const num = String(record.number).padStart(4, '0');

        // Rename with padded number
        await ticketChannel.setName(`ticket-${num}-${safeName}`);

        const welcomeEmbed = new EmbedBuilder()
          .setColor(Colors.primary)
          .setTitle(`🎫  Ticket #${num}`)
          .setDescription(
            `Welcome <@${user.id}>!\n\n` +
            `Please describe your issue in detail and a team member will respond shortly.\n\n` +
            `**Tips:**\n` +
            `> • Be as specific as possible\n` +
            `> • Include screenshots if helpful\n` +
            `> • Stay patient — we'll get to you soon!`
          )
          .setFooter({ text: 'LaunchFrame Support  •  Click Close when resolved' })
          .setTimestamp();

        const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_close')
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
        );

        await ticketChannel.send({
          content: `<@${user.id}>`,
          embeds: [welcomeEmbed],
          components: [closeRow],
        });

        await interaction.editReply({
          embeds: [Embeds.success(`Ticket #${num} Created`, `Your private support channel: <#${ticketChannel.id}>`)],
        });

        logger.success(`Ticket #${num} opened by ${user.tag} in ${guild.name}`);
      } catch (err) {
        logger.error('Failed to create ticket', err);
        try {
          await interaction.editReply({ embeds: [Embeds.error('Error', 'Could not create your ticket. Please try again.')] });
        } catch {}
      }
      return;
    }

    // ── Close ticket ───────────────────────────────────────
    if (customId === 'ticket_close') {
      try {
        const record = TicketManager.getTicketByChannel(guild.id, interaction.channelId);
        if (!record) {
          return interaction.reply({ embeds: [Embeds.error('Error', 'This is not a tracked ticket.')], ephemeral: true });
        }

        // Ticket creator or bot owner can close
        if (user.id !== record.userId && !isOwner(user.id)) {
          return interaction.reply({
            embeds: [Embeds.error('Access Denied', 'Only the ticket creator or bot owner can close this ticket.')],
            ephemeral: true,
          });
        }

        const num = String(record.number).padStart(4, '0');
        await interaction.reply({
          embeds: [Embeds.warning(`Closing Ticket #${num}`, 'This channel will be **deleted in 5 seconds**.')],
        });

        TicketManager.closeTicket(guild.id, interaction.channelId);

        const logId = process.env.MOD_LOG_CHANNEL_ID;
        if (logId) {
          const logCh = guild.channels.cache.get(logId) as TextChannel | undefined;
          await logCh?.send({
            embeds: [Embeds.modAction(
              'Ticket Closed',
              `<@${record.userId}> (${record.username})`,
              `<@${user.id}>`,
              'Closed via button',
              { 'Ticket': `#${num}` }
            )],
          });
        }

        setTimeout(async () => {
          try { await (interaction.channel as TextChannel).delete('Ticket closed'); } catch {}
        }, 5_000);

        logger.success(`Ticket #${num} closed by ${user.tag} in ${guild.name}`);
      } catch (err) {
        logger.error('Failed to close ticket', err);
      }
      return;
    }
  });
}

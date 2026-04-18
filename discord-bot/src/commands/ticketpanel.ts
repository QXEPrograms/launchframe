import {
  SlashCommandBuilder, ChatInputCommandInteraction, TextChannel,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType,
} from 'discord.js';
import { Command } from '../types';
import { Embeds, Colors } from '../utils/embeds';
import { TicketManager } from '../utils/ticketManager';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Post the ticket panel with an Open Ticket button')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to post the panel in').setRequired(true))
    .addChannelOption(o => o.setName('category').setDescription('Category where ticket channels will be created').setRequired(true))
    .addRoleOption(o => o.setName('support_role').setDescription('Role that can see all tickets').setRequired(false))
    .addStringOption(o => o.setName('title').setDescription('Panel title').setRequired(false))
    .addStringOption(o => o.setName('description').setDescription('Panel description').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const channel = interaction.options.getChannel('channel', true) as TextChannel;
    const category = interaction.options.getChannel('category', true);
    const supportRole = interaction.options.getRole('support_role');
    const title = interaction.options.getString('title') ?? 'Support Tickets';
    const desc = interaction.options.getString('description') ??
      'Need help with LaunchFrame? Click the button below to open a private support ticket.\n\nOur team will get back to you as soon as possible.';

    TicketManager.setConfig(interaction.guild.id, {
      categoryId: category.id,
      supportRoleId: supportRole?.id,
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.primary)
      .setTitle(`🎫  ${title}`)
      .setDescription(desc)
      .addFields({
        name: '📋  How it works',
        value: '> 1. Click **Open a Ticket** below\n> 2. A private channel will be created for you\n> 3. Describe your issue clearly\n> 4. Click **Close Ticket** when resolved',
      })
      .setFooter({ text: 'LaunchFrame Support' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_open')
        .setLabel('Open a Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫')
    );

    await channel.send({ embeds: [embed], components: [row] });

    await interaction.reply({
      embeds: [Embeds.success(
        'Ticket Panel Posted',
        `Panel sent to <#${channel.id}>.\nTickets will open inside the **${category.name}** category.`
      )],
      ephemeral: true,
    });
  },
};

import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, PermissionFlagsBits } from 'discord.js';
import { Command } from '../types';
import { Embeds } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel so @everyone cannot send messages')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to lock (defaults to current)').setRequired(false))
    .addStringOption(o => o.setName('reason').setDescription('Reason for locking').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const channel = (interaction.options.getChannel('channel') ?? interaction.channel) as TextChannel;
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false,
    }, { reason: `Locked by ${interaction.user.tag}: ${reason}` });

    await channel.send({ embeds: [Embeds.warning('Channel Locked', `This channel has been locked by <@${interaction.user.id}>.\n**Reason:** ${reason}`)] });

    await interaction.reply({ embeds: [Embeds.success('Channel Locked', `<#${channel.id}> has been locked.`)], ephemeral: true });
  },
};

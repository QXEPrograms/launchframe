import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { Command } from '../types';
import { Embeds } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a channel')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to unlock (defaults to current)').setRequired(false))
    .addStringOption(o => o.setName('reason').setDescription('Reason for unlocking').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const channel = (interaction.options.getChannel('channel') ?? interaction.channel) as TextChannel;
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null,
    }, { reason: `Unlocked by ${interaction.user.tag}: ${reason}` });

    await channel.send({ embeds: [Embeds.success('Channel Unlocked', `This channel has been unlocked by <@${interaction.user.id}>.`)] });

    await interaction.reply({ embeds: [Embeds.success('Channel Unlocked', `<#${channel.id}> is now unlocked.`)], ephemeral: true });
  },
};

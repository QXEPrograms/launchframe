import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { Command } from '../types';
import { Embeds } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for a channel')
    .addIntegerOption(o =>
      o.setName('seconds').setDescription('Slowmode in seconds (0 to disable, max 21600)').setMinValue(0).setMaxValue(21600).setRequired(true)
    )
    .addChannelOption(o => o.setName('channel').setDescription('Target channel (defaults to current)').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const seconds = interaction.options.getInteger('seconds', true);
    const channel = (interaction.options.getChannel('channel') ?? interaction.channel) as TextChannel;

    await channel.setRateLimitPerUser(seconds, `Slowmode set by ${interaction.user.tag}`);

    const msg = seconds === 0
      ? `Slowmode **disabled** in <#${channel.id}>.`
      : `Slowmode set to **${seconds}s** in <#${channel.id}>.`;

    await interaction.reply({ embeds: [Embeds.success('Slowmode Updated', msg)] });
  },
};

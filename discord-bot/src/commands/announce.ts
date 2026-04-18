import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, ColorResolvable } from 'discord.js';
import { Command } from '../types';
import { Embeds } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send a styled announcement embed to a channel')
    .addStringOption(o => o.setName('title').setDescription('Announcement title').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('Announcement body (use \\n for newlines)').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Target channel (defaults to current)').setRequired(false))
    .addStringOption(o => o.setName('color').setDescription('Embed color hex e.g. #a855f7').setRequired(false))
    .addRoleOption(o => o.setName('ping').setDescription('Role to ping alongside the announcement').setRequired(false))
    .addStringOption(o => o.setName('image').setDescription('Image URL to attach to the embed').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const title = interaction.options.getString('title', true);
    const message = interaction.options.getString('message', true).replace(/\\n/g, '\n');
    const channel = (interaction.options.getChannel('channel') ?? interaction.channel) as TextChannel;
    const colorRaw = interaction.options.getString('color');
    const pingRole = interaction.options.getRole('ping');
    const imageUrl = interaction.options.getString('image');

    let color: ColorResolvable = 0xA855F7;
    if (colorRaw) {
      const parsed = parseInt(colorRaw.replace('#', ''), 16);
      if (!isNaN(parsed)) color = parsed as ColorResolvable;
    }

    const embed = Embeds.announcement(title, message, color)
      .setFooter({ text: `Announced by ${interaction.user.username}` });

    if (imageUrl) embed.setImage(imageUrl);

    await channel.send({ content: pingRole ? `<@&${pingRole.id}>` : undefined, embeds: [embed] });

    await interaction.reply({
      embeds: [Embeds.success('Announcement Sent', `Posted in <#${channel.id}>`)],
      ephemeral: true,
    });
  },
};

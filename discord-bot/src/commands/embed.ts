import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel, ColorResolvable } from 'discord.js';
import { Command } from '../types';
import { Embeds, Colors } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Send a fully custom embed to a channel')
    .addStringOption(o => o.setName('title').setDescription('Embed title').setRequired(true))
    .addStringOption(o => o.setName('description').setDescription('Embed body (use \\n for newlines)').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Target channel').setRequired(false))
    .addStringOption(o => o.setName('color').setDescription('Hex color e.g. #6366f1').setRequired(false))
    .addStringOption(o => o.setName('thumbnail').setDescription('Thumbnail image URL').setRequired(false))
    .addStringOption(o => o.setName('image').setDescription('Large image URL').setRequired(false))
    .addStringOption(o => o.setName('footer').setDescription('Footer text').setRequired(false))
    .addStringOption(o => o.setName('url').setDescription('URL for the title to link to').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const title = interaction.options.getString('title', true);
    const description = interaction.options.getString('description', true).replace(/\\n/g, '\n');
    const channel = (interaction.options.getChannel('channel') ?? interaction.channel) as TextChannel;
    const colorRaw = interaction.options.getString('color');
    const thumbnail = interaction.options.getString('thumbnail');
    const image = interaction.options.getString('image');
    const footer = interaction.options.getString('footer');
    const url = interaction.options.getString('url');

    let color: ColorResolvable = Colors.primary;
    if (colorRaw) {
      const parsed = parseInt(colorRaw.replace('#', ''), 16);
      if (!isNaN(parsed)) color = parsed as ColorResolvable;
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();

    if (thumbnail) embed.setThumbnail(thumbnail);
    if (image) embed.setImage(image);
    if (footer) embed.setFooter({ text: footer });
    if (url) embed.setURL(url);

    await channel.send({ embeds: [embed] });

    await interaction.reply({
      embeds: [Embeds.success('Embed Sent', `Posted in <#${channel.id}>`)],
      ephemeral: true,
    });
  },
};

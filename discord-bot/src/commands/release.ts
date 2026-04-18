import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  ButtonBuilder, ButtonStyle, ActionRowBuilder, TextChannel, ColorResolvable
} from 'discord.js';
import axios from 'axios';
import { Command, GitHubRelease } from '../types';
import { Embeds, Colors } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('release')
    .setDescription('Announce the latest LaunchFrame release to a channel')
    .addChannelOption(o => o.setName('channel').setDescription('Where to post the announcement').setRequired(false))
    .addRoleOption(o => o.setName('ping').setDescription('Role to ping').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    await interaction.deferReply({ ephemeral: true });

    const channel = (interaction.options.getChannel('channel') ?? interaction.channel) as TextChannel;
    const pingRole = interaction.options.getRole('ping');

    const repo = process.env.GITHUB_REPO ?? 'qxeprograms/launchframe';
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'LaunchFrame-Discord-Bot',
    };
    if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;

    let release: GitHubRelease;
    try {
      const { data } = await axios.get<GitHubRelease>(
        `https://api.github.com/repos/${repo}/releases/latest`,
        { headers, timeout: 12_000 }
      );
      release = data;
    } catch {
      return interaction.editReply({ embeds: [Embeds.error('GitHub API Error', 'Could not fetch release data.')] });
    }

    const notes = release.body
      ? release.body.slice(0, 1500) + (release.body.length > 1500 ? '\n…' : '')
      : 'See the release page for details.';

    const dmgAsset = release.assets.find(a => a.name.endsWith('.dmg'));

    const embed = new EmbedBuilder()
      .setColor(Colors.announce as ColorResolvable)
      .setTitle(`🚀  LaunchFrame ${release.tag_name} is out!`)
      .setDescription(notes)
      .addFields(
        { name: '🏷️  Version', value: release.tag_name, inline: true },
        { name: '⚙️  Type', value: release.prerelease ? 'Pre-release' : 'Stable', inline: true },
      )
      .setFooter({ text: 'LaunchFrame — the ultimate Roblox launcher for macOS' })
      .setTimestamp(new Date(release.published_at));

    const buttons = [
      new ButtonBuilder().setLabel('Full Release Notes').setStyle(ButtonStyle.Link).setURL(release.html_url).setEmoji('📋'),
    ];
    if (dmgAsset) {
      buttons.push(new ButtonBuilder().setLabel('Download').setStyle(ButtonStyle.Link).setURL(dmgAsset.browser_download_url).setEmoji('⬇️'));
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

    await channel.send({
      content: pingRole ? `<@&${pingRole.id}>` : undefined,
      embeds: [embed],
      components: [row],
    });

    await interaction.editReply({ embeds: [Embeds.success('Release Announced', `Posted in <#${channel.id}>`)] });
  },
};

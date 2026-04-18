import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import axios from 'axios';
import { Command, GitHubRelease } from '../types';
import { Embeds, Colors } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Show the latest LaunchFrame release and app status'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

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
      return interaction.editReply({ embeds: [Embeds.error('GitHub API Error', 'Could not fetch release data. Try again later.')] });
    }

    const totalDownloads = release.assets.reduce((s, a) => s + a.download_count, 0);
    const publishedTs = Math.floor(new Date(release.published_at).getTime() / 1000);

    const notes = release.body
      ? release.body.slice(0, 800) + (release.body.length > 800 ? '…' : '')
      : 'No release notes provided.';

    const dmgAsset = release.assets.find(a => a.name.endsWith('.dmg'));
    const zipAsset = release.assets.find(a => a.name.endsWith('.zip'));

    const embed = new EmbedBuilder()
      .setColor(Colors.status)
      .setTitle(`🚀  LaunchFrame ${release.tag_name}`)
      .setDescription(notes)
      .addFields(
        { name: '📅  Released', value: `<t:${publishedTs}:D>  (<t:${publishedTs}:R>)`, inline: true },
        { name: '⬇️  Total Downloads', value: totalDownloads.toLocaleString(), inline: true },
        { name: '🏷️  Tag', value: `\`${release.tag_name}\``, inline: true },
        { name: '⚙️  Status', value: release.prerelease ? '🔶 Pre-release' : '✅ Stable', inline: true },
      )
      .setFooter({ text: 'LaunchFrame Bot  •  Data from GitHub Releases' })
      .setTimestamp();

    const buttons: ButtonBuilder[] = [
      new ButtonBuilder().setLabel('View Release').setStyle(ButtonStyle.Link).setURL(release.html_url).setEmoji('📋'),
    ];
    if (dmgAsset) buttons.push(new ButtonBuilder().setLabel('Download .dmg').setStyle(ButtonStyle.Link).setURL(dmgAsset.browser_download_url).setEmoji('💾'));
    if (zipAsset) buttons.push(new ButtonBuilder().setLabel('Download .zip').setStyle(ButtonStyle.Link).setURL(zipAsset.browser_download_url).setEmoji('📦'));

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

    await interaction.editReply({ embeds: [embed], components: [row] });
  },
};

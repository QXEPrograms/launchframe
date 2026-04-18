import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { Colors } from '../utils/embeds';
import { DataManager } from '../utils/dataManager';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show detailed info about a user')
    .addUserOption(o => o.setName('user').setDescription('The user to look up (defaults to you)').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const target = interaction.options.getUser('user') ?? interaction.user;
    const member = interaction.guild.members.cache.get(target.id);

    const createdTs = Math.floor(target.createdTimestamp / 1000);
    const joinedTs = member ? Math.floor(member.joinedTimestamp! / 1000) : null;
    const warnings = DataManager.getWarnings(interaction.guild.id, target.id);

    const roles = member
      ? member.roles.cache
          .filter(r => r.id !== interaction.guild!.id)
          .sort((a, b) => b.position - a.position)
          .map(r => `<@&${r.id}>`)
          .slice(0, 10)
          .join(' ') || 'None'
      : 'N/A';

    const flags = target.flags?.toArray().map(f => `\`${f}\``).join(', ') || 'None';

    const embed = new EmbedBuilder()
      .setColor(member?.displayColor || Colors.primary)
      .setTitle(`👤  ${target.tag}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '🆔  User ID', value: `\`${target.id}\``, inline: true },
        { name: '🤖  Bot', value: target.bot ? 'Yes' : 'No', inline: true },
        { name: '📅  Account Created', value: `<t:${createdTs}:D>  (<t:${createdTs}:R>)` },
        ...(joinedTs ? [{ name: '📥  Joined Server', value: `<t:${joinedTs}:D>  (<t:${joinedTs}:R>)` }] : []),
        ...(member?.nickname ? [{ name: '✏️  Nickname', value: member.nickname, inline: true }] : []),
        { name: '⚠️  Warnings', value: `${warnings.length}`, inline: true },
        { name: `🎭  Roles (${member?.roles.cache.size ? member.roles.cache.size - 1 : 0})`, value: roles },
        { name: '🏷️  Badges', value: flags },
      )
      .setFooter({ text: 'LaunchFrame Bot' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

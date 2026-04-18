import { EmbedBuilder, ColorResolvable } from 'discord.js';

export const Colors = {
  primary:  0x6366F1 as ColorResolvable,
  success:  0x22C55E as ColorResolvable,
  error:    0xEF4444 as ColorResolvable,
  warning:  0xF59E0B as ColorResolvable,
  info:     0x3B82F6 as ColorResolvable,
  announce: 0xA855F7 as ColorResolvable,
  modlog:   0xF97316 as ColorResolvable,
  neutral:  0x6B7280 as ColorResolvable,
  status:   0x10B981 as ColorResolvable,
};

const FOOTER = 'LaunchFrame Bot';

function base(color: ColorResolvable): EmbedBuilder {
  return new EmbedBuilder().setColor(color).setFooter({ text: FOOTER }).setTimestamp();
}

export const Embeds = {
  success(title: string, description?: string): EmbedBuilder {
    return base(Colors.success).setTitle(`✅  ${title}`).setDescription(description ?? null);
  },

  error(title: string, description?: string): EmbedBuilder {
    return base(Colors.error).setTitle(`❌  ${title}`).setDescription(description ?? null);
  },

  warning(title: string, description?: string): EmbedBuilder {
    return base(Colors.warning).setTitle(`⚠️  ${title}`).setDescription(description ?? null);
  },

  info(title: string, description?: string): EmbedBuilder {
    return base(Colors.info).setTitle(`ℹ️  ${title}`).setDescription(description ?? null);
  },

  modAction(
    action: string,
    target: string,
    moderator: string,
    reason: string,
    extra?: Record<string, string>
  ): EmbedBuilder {
    const icons: Record<string, string> = {
      Ban: '🔨',
      Unban: '🔓',
      Kick: '👢',
      Timeout: '⏳',
      Untimeout: '🔔',
      Warn: '⚠️',
      'Message Purge': '🗑️',
      'Message Deleted': '🗑️',
      'Nick Changed': '✏️',
      'Role Added': '➕',
      'Role Removed': '➖',
    };

    const embed = base(Colors.modlog)
      .setTitle(`${icons[action] ?? '🛡️'}  ${action}`)
      .addFields(
        { name: 'Target', value: target, inline: true },
        { name: 'Moderator', value: moderator, inline: true },
        { name: 'Reason', value: reason }
      );

    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        embed.addFields({ name: k, value: v, inline: true });
      }
    }

    return embed;
  },

  announcement(title: string, description: string, color: ColorResolvable = Colors.announce): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(color)
      .setTitle(`📢  ${title}`)
      .setDescription(description)
      .setFooter({ text: 'LaunchFrame Announcement' })
      .setTimestamp();
  },

  welcome(username: string, avatarUrl: string | null, memberCount: number): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(Colors.primary)
      .setTitle('🚀  Welcome to LaunchFrame!')
      .setDescription(
        `Hey **${username}**, glad you're here!\n\n` +
        `LaunchFrame is the ultimate Roblox launcher for macOS — ` +
        `with fast-flag editing, Discord Rich Presence, activity tracking, and more.\n\n` +
        `You are member **#${memberCount.toLocaleString()}**! Make yourself at home.`
      )
      .setThumbnail(avatarUrl)
      .setFooter({ text: 'LaunchFrame Bot' })
      .setTimestamp();
  },
};

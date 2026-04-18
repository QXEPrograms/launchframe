import { Client, GuildMember, TextChannel } from 'discord.js';
import { logger } from '../utils/logger';
import { Embeds } from '../utils/embeds';

export function setupGuildMemberAdd(client: Client): void {
  client.on('guildMemberAdd', async (member: GuildMember) => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) return;

    try {
      const channel = member.guild.channels.cache.get(channelId) as TextChannel | undefined;
      if (!channel?.isTextBased()) return;

      await channel.send({
        content: `<@${member.user.id}>`,
        embeds: [
          Embeds.welcome(
            member.user.username,
            member.user.displayAvatarURL({ size: 256 }),
            member.guild.memberCount
          ),
        ],
      });
    } catch (err) {
      logger.error('Failed to send welcome message', err);
    }
  });
}

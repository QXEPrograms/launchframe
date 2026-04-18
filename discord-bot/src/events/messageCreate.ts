import { Client, Message, TextChannel, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { DataManager } from '../utils/dataManager';
import { Embeds } from '../utils/embeds';
import { isOwner } from '../utils/permissions';
import { logger } from '../utils/logger';

const INVITE_RE = /discord\.(gg|com\/invite)\/[a-zA-Z0-9-]+/i;
const SPAM_LIMIT = 5;
const SPAM_WINDOW = 5_000;
const spamMap = new Map<string, number[]>();

async function postModLog(client: Client, embed: EmbedBuilder): Promise<void> {
  const id = process.env.MOD_LOG_CHANNEL_ID;
  if (!id) return;
  try {
    const ch = client.channels.cache.get(id) as TextChannel | undefined;
    if (ch?.isTextBased()) await ch.send({ embeds: [embed] });
  } catch {}
}

async function tempReply(message: Message, embed: EmbedBuilder): Promise<void> {
  try {
    const m = await message.channel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
    setTimeout(() => m.delete().catch(() => {}), 8_000);
  } catch {}
}

export function setupMessageCreate(client: Client): void {
  client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.guild) return;
    if (isOwner(message.author.id)) return;

    const member = message.guild.members.cache.get(message.author.id);
    if (!member) return;
    if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const now = Date.now();

    // ── Invite links ──────────────────────────────────────
    if (INVITE_RE.test(message.content)) {
      try {
        await message.delete();
        DataManager.addWarning(guildId, userId, 'Posted a Discord invite link', client.user!.id);
        await tempReply(message, Embeds.warning('Invite Links Blocked', 'Discord invite links are not allowed here.'));
        await postModLog(client, Embeds.modAction(
          'Message Deleted', `<@${userId}> (${message.author.tag})`,
          `<@${client.user!.id}> (AutoMod)`, 'Posted a Discord invite link'
        ));
      } catch (err) { logger.error('AutoMod: invite link', err); }
      return;
    }

    // ── Mass mentions ─────────────────────────────────────
    const mentions = message.mentions.users.size + (message.mentions.everyone ? 2 : 0);
    if (mentions >= 5) {
      try {
        await message.delete();
        DataManager.addWarning(guildId, userId, `Mass mention (${mentions})`, client.user!.id);
        await tempReply(message, Embeds.warning('Mass Mentions Blocked', `You cannot ping ${mentions} people at once.`));
        await postModLog(client, Embeds.modAction(
          'Message Deleted', `<@${userId}> (${message.author.tag})`,
          `<@${client.user!.id}> (AutoMod)`, `Mass mention — ${mentions} pings`
        ));
      } catch (err) { logger.error('AutoMod: mass mention', err); }
      return;
    }

    // ── Spam detection ────────────────────────────────────
    const stamps = (spamMap.get(userId) ?? []).filter(t => now - t < SPAM_WINDOW);
    stamps.push(now);
    spamMap.set(userId, stamps);

    if (stamps.length >= SPAM_LIMIT) {
      spamMap.delete(userId);
      try {
        await member.timeout(5 * 60_000, 'AutoMod: spam');
        DataManager.addWarning(guildId, userId, 'Spamming (AutoMod)', client.user!.id);
        await tempReply(message, Embeds.warning('Spam Detected', 'You have been timed out for 5 minutes for spamming.'));
        await postModLog(client, Embeds.modAction(
          'Timeout', `<@${userId}> (${message.author.tag})`,
          `<@${client.user!.id}> (AutoMod)`, 'Spam — 5 minute timeout'
        ));
      } catch (err) { logger.error('AutoMod: spam timeout', err); }
    }
  });
}

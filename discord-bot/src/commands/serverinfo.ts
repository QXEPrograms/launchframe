import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ChannelType, VerificationLevel } from 'discord.js';
import { Command } from '../types';
import { Colors } from '../utils/embeds';

const VERIFICATION: Record<VerificationLevel, string> = {
  [VerificationLevel.None]: 'None',
  [VerificationLevel.Low]: 'Low',
  [VerificationLevel.Medium]: 'Medium',
  [VerificationLevel.High]: 'High',
  [VerificationLevel.VeryHigh]: 'Very High',
};

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Show detailed info about this server'),

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) return;

    await guild.fetch();

    const owner = await guild.fetchOwner();
    const createdTs = Math.floor(guild.createdTimestamp / 1000);
    const text = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
    const voice = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
    const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const boostLevel = guild.premiumTier;

    const embed = new EmbedBuilder()
      .setColor(Colors.primary)
      .setTitle(`🏠  ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: '👑  Owner', value: `<@${owner.id}>`, inline: true },
        { name: '🆔  Server ID', value: `\`${guild.id}\``, inline: true },
        { name: '📅  Created', value: `<t:${createdTs}:D>  (<t:${createdTs}:R>)` },
        { name: '👥  Members', value: `${guild.memberCount.toLocaleString()} total  •  ${bots} bots`, inline: true },
        { name: '🎭  Roles', value: `${guild.roles.cache.size}`, inline: true },
        { name: '😀  Emojis', value: `${guild.emojis.cache.size}`, inline: true },
        { name: '💬  Channels', value: `${text} text  •  ${voice} voice  •  ${categories} categories`, inline: false },
        { name: '🔒  Verification', value: VERIFICATION[guild.verificationLevel], inline: true },
        { name: '🚀  Boost Level', value: `Tier ${boostLevel}  (${guild.premiumSubscriptionCount ?? 0} boosts)`, inline: true },
      )
      .setFooter({ text: 'LaunchFrame Bot' })
      .setTimestamp();

    if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 1024 }));

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

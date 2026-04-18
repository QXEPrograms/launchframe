import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { Embeds, Colors } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member')
    .addUserOption(o => o.setName('user').setDescription('The user to timeout').setRequired(true))
    .addIntegerOption(o =>
      o.setName('minutes').setDescription('Duration in minutes (1–40320 / 28 days)').setMinValue(1).setMaxValue(40320).setRequired(true)
    )
    .addStringOption(o => o.setName('reason').setDescription('Reason for the timeout').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const target = interaction.options.getUser('user', true);
    const minutes = interaction.options.getInteger('minutes', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    const member = interaction.guild.members.cache.get(target.id);
    if (!member) {
      return interaction.reply({ embeds: [Embeds.error('User Not Found', 'That user is not in this server.')], ephemeral: true });
    }
    if (!member.moderatable) {
      return interaction.reply({ embeds: [Embeds.error('Cannot Timeout', 'I cannot moderate this user.')], ephemeral: true });
    }

    const ms = minutes * 60_000;
    const until = new Date(Date.now() + ms);

    try {
      await target.send({
        embeds: [new EmbedBuilder()
          .setColor(Colors.warning)
          .setTitle('⏳  You have been timed out')
          .setDescription(`You were timed out in **${interaction.guild.name}**.`)
          .addFields(
            { name: 'Duration', value: `${minutes} minute(s)`, inline: true },
            { name: 'Expires', value: `<t:${Math.floor(until.getTime() / 1000)}:R>`, inline: true },
            { name: 'Reason', value: reason }
          )
          .setTimestamp()],
      });
    } catch { /* DMs disabled */ }

    await member.timeout(ms, reason);

    await interaction.reply({
      embeds: [Embeds.success(
        'User Timed Out',
        `**${target.tag}** has been timed out for **${minutes} minute(s)**.\n**Reason:** ${reason}`
      )],
    });

    const logId = process.env.MOD_LOG_CHANNEL_ID;
    if (logId) {
      const logCh = interaction.guild.channels.cache.get(logId) as TextChannel | undefined;
      await logCh?.send({
        embeds: [Embeds.modAction(
          'Timeout', `<@${target.id}> (${target.tag})`, `<@${interaction.user.id}>`, reason,
          { Duration: `${minutes} min`, Expires: `<t:${Math.floor(until.getTime() / 1000)}:R>` }
        )],
      });
    }
  },
};

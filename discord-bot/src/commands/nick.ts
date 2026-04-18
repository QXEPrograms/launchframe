import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { Command } from '../types';
import { Embeds } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('nick')
    .setDescription("Change a member's nickname")
    .addUserOption(o => o.setName('user').setDescription('The user').setRequired(true))
    .addStringOption(o => o.setName('nickname').setDescription('New nickname (leave empty to reset)').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const target = interaction.options.getUser('user', true);
    const nick = interaction.options.getString('nickname') ?? null;
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({ embeds: [Embeds.error('User Not Found', 'That user is not in this server.')], ephemeral: true });
    }
    if (!member.manageable) {
      return interaction.reply({ embeds: [Embeds.error('Cannot Modify', 'I cannot change this user\'s nickname.')], ephemeral: true });
    }

    const oldNick = member.nickname ?? member.user.username;
    await member.setNickname(nick, `Changed by ${interaction.user.tag}`);

    const logId = process.env.MOD_LOG_CHANNEL_ID;
    if (logId) {
      const logCh = interaction.guild.channels.cache.get(logId) as TextChannel | undefined;
      await logCh?.send({
        embeds: [Embeds.modAction(
          'Nick Changed', `<@${target.id}> (${target.tag})`, `<@${interaction.user.id}>`,
          nick ? `${oldNick} → ${nick}` : `${oldNick} → (reset)`
        )],
      });
    }

    await interaction.reply({
      embeds: [Embeds.success('Nickname Changed', nick ? `Set to **${nick}**` : 'Nickname has been reset.')],
    });
  },
};

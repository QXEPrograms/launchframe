import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { Command } from '../types';
import { Embeds } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Add or remove a role from a member')
    .addStringOption(o =>
      o.setName('action').setDescription('Action to perform').setRequired(true)
        .addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' })
    )
    .addUserOption(o => o.setName('user').setDescription('The user').setRequired(true))
    .addRoleOption(o => o.setName('role').setDescription('The role').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const action = interaction.options.getString('action', true) as 'add' | 'remove';
    const target = interaction.options.getUser('user', true);
    const role = interaction.options.getRole('role', true);
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({ embeds: [Embeds.error('User Not Found', 'That user is not in this server.')], ephemeral: true });
    }

    const botMember = interaction.guild.members.me;
    if (botMember && role.position >= botMember.roles.highest.position) {
      return interaction.reply({ embeds: [Embeds.error('Role Too High', 'I cannot manage this role.')], ephemeral: true });
    }

    if (action === 'add') {
      if (member.roles.cache.has(role.id)) {
        return interaction.reply({ embeds: [Embeds.info('Already Has Role', `**${target.tag}** already has <@&${role.id}>.`)], ephemeral: true });
      }
      await member.roles.add(role.id, `Role added by ${interaction.user.tag}`);
    } else {
      if (!member.roles.cache.has(role.id)) {
        return interaction.reply({ embeds: [Embeds.info("Doesn't Have Role", `**${target.tag}** doesn't have <@&${role.id}>.`)], ephemeral: true });
      }
      await member.roles.remove(role.id, `Role removed by ${interaction.user.tag}`);
    }

    const logId = process.env.MOD_LOG_CHANNEL_ID;
    if (logId) {
      const logCh = interaction.guild.channels.cache.get(logId) as TextChannel | undefined;
      await logCh?.send({
        embeds: [Embeds.modAction(
          action === 'add' ? 'Role Added' : 'Role Removed',
          `<@${target.id}> (${target.tag})`,
          `<@${interaction.user.id}>`,
          `<@&${role.id}>`
        )],
      });
    }

    const verb = action === 'add' ? 'added to' : 'removed from';
    await interaction.reply({
      embeds: [Embeds.success('Role Updated', `<@&${role.id}> ${verb} **${target.tag}**.`)],
    });
  },
};

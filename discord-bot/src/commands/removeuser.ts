import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types';
import { Embeds } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('removeuser')
    .setDescription('Remove a user from the current ticket channel')
    .addUserOption(o => o.setName('user').setDescription('User to remove').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('user', true);
    const channel = interaction.channel;
    if (!channel?.isTextBased()) return;

    await channel.permissionOverwrites.edit(target.id, {
      ViewChannel: false,
      SendMessages: false,
    });

    await interaction.reply({
      embeds: [Embeds.success('User Removed', `<@${target.id}> no longer has access to this ticket.`)],
    });
  },
};

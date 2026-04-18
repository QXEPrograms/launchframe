import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types';
import { Embeds } from '../utils/embeds';
import { DataManager } from '../utils/dataManager';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription("Clear all warnings for a member")
    .addUserOption(o => o.setName('user').setDescription('The user to clear warnings for').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const target = interaction.options.getUser('user', true);
    const count = DataManager.clearWarnings(interaction.guild.id, target.id);

    await interaction.reply({
      embeds: [
        count === 0
          ? Embeds.info('No Warnings', `**${target.tag}** had no warnings to clear.`)
          : Embeds.success('Warnings Cleared', `Cleared **${count}** warning(s) from **${target.tag}**.`),
      ],
    });
  },
};

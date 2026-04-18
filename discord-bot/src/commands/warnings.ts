import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { Embeds, Colors } from '../utils/embeds';
import { DataManager } from '../utils/dataManager';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription("View a member's warnings")
    .addUserOption(o => o.setName('user').setDescription('The user to look up').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const target = interaction.options.getUser('user', true);
    const warnings = DataManager.getWarnings(interaction.guild.id, target.id);

    if (warnings.length === 0) {
      return interaction.reply({
        embeds: [Embeds.info('No Warnings', `**${target.tag}** has no warnings on record.`)],
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.warning)
      .setTitle(`⚠️  Warnings — ${target.tag}`)
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: `LaunchFrame Bot  •  ${warnings.length} warning(s) total` })
      .setTimestamp();

    const shown = warnings.slice(-10); // show last 10
    for (const w of shown) {
      const mod = `<@${w.moderatorId}>`;
      const when = `<t:${Math.floor(w.timestamp / 1000)}:R>`;
      embed.addFields({ name: `ID: \`${w.id.slice(0, 8)}\`  •  ${when}`, value: `${w.reason}\n— by ${mod}` });
    }

    if (warnings.length > 10) {
      embed.setDescription(`Showing last 10 of ${warnings.length} warnings.`);
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

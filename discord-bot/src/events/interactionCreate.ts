import { Client, Interaction } from 'discord.js';
import { Embeds } from '../utils/embeds';
import { logger } from '../utils/logger';
import { isOwner } from '../utils/permissions';

export function setupInteractionCreate(client: Client): void {
  client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    logger.command(
      interaction.commandName,
      interaction.user.tag,
      interaction.guild?.name ?? 'DM'
    );

    if (!isOwner(interaction.user.id)) {
      await interaction.reply({
        embeds: [Embeds.error('Access Denied', 'Only the bot owner can use this command.')],
        ephemeral: true,
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      logger.error(`Error running /${interaction.commandName}`, err);
      const embed = Embeds.error('Command Error', 'Something went wrong. Check the console for details.');
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  });
}

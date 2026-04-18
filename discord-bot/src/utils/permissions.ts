import { ChatInputCommandInteraction } from 'discord.js';
import { Embeds } from './embeds';

export function isOwner(userId: string): boolean {
  return userId === process.env.OWNER_ID;
}

export async function checkOwner(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (isOwner(interaction.user.id)) return true;

  await interaction.reply({
    embeds: [Embeds.error('Access Denied', 'Only the bot owner can use this command.')],
    ephemeral: true,
  });
  return false;
}

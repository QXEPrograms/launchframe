import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { Command } from '../types';
import { Embeds } from '../utils/embeds';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot send a plain text message in a channel')
    .addStringOption(o => o.setName('message').setDescription('Message to send (use \\n for newlines)').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Target channel (defaults to current)').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString('message', true).replace(/\\n/g, '\n');
    const channel = (interaction.options.getChannel('channel') ?? interaction.channel) as TextChannel;

    await channel.send(message);

    await interaction.reply({
      embeds: [Embeds.success('Message Sent', `Sent to <#${channel.id}>`)],
      ephemeral: true,
    });
  },
};

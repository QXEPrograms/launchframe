import { ChatInputCommandInteraction, Collection, SlashCommandBuilder } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface Warning {
  id: string;
  reason: string;
  timestamp: number;
  moderatorId: string;
}

export interface WarningsData {
  [guildId: string]: {
    [userId: string]: Warning[];
  };
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: {
    name: string;
    download_count: number;
    browser_download_url: string;
    size: number;
  }[];
  prerelease: boolean;
  draft: boolean;
}

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
  }
}

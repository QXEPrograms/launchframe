import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { Command } from './types';
import { logger } from './utils/logger';
import { setupReady } from './events/ready';
import { setupGuildMemberAdd } from './events/guildMemberAdd';
import { setupInteractionCreate } from './events/interactionCreate';
import { setupMessageCreate } from './events/messageCreate';

// ── Commands ──────────────────────────────────────────────
import { command as announce } from './commands/announce';
import { command as ban } from './commands/ban';
import { command as kick } from './commands/kick';
import { command as timeout } from './commands/timeout';
import { command as untimeout } from './commands/untimeout';
import { command as warn } from './commands/warn';
import { command as warnings } from './commands/warnings';
import { command as clearwarns } from './commands/clearwarns';
import { command as purge } from './commands/purge';
import { command as slowmode } from './commands/slowmode';
import { command as lock } from './commands/lock';
import { command as unlock } from './commands/unlock';
import { command as status } from './commands/status';
import { command as release } from './commands/release';
import { command as userinfo } from './commands/userinfo';
import { command as serverinfo } from './commands/serverinfo';
import { command as say } from './commands/say';
import { command as embed } from './commands/embed';
import { command as nick } from './commands/nick';
import { command as role } from './commands/role';

// ── Validation ────────────────────────────────────────────
if (!process.env.DISCORD_TOKEN) {
  logger.error('DISCORD_TOKEN is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}
if (!process.env.OWNER_ID) {
  logger.error('OWNER_ID is not set. Add your Discord user ID to .env.');
  process.exit(1);
}

// ── Client setup ──────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.commands = new Collection<string, Command>();

// ── Register commands ─────────────────────────────────────
const allCommands: Command[] = [
  announce, ban, kick, timeout, untimeout,
  warn, warnings, clearwarns,
  purge, slowmode, lock, unlock,
  status, release,
  userinfo, serverinfo,
  say, embed, nick, role,
];

for (const cmd of allCommands) {
  client.commands.set(cmd.data.name, cmd);
  logger.info(`Loaded /${cmd.data.name}`);
}

// ── Register events ───────────────────────────────────────
setupReady(client);
setupGuildMemberAdd(client);
setupInteractionCreate(client);
setupMessageCreate(client);

// ── Global error handling ─────────────────────────────────
process.on('unhandledRejection', (err) => logger.error('Unhandled rejection', err));
process.on('uncaughtException', (err) => logger.error('Uncaught exception', err));

process.on('SIGINT', () => {
  logger.info('Shutting down gracefully…');
  client.destroy();
  process.exit(0);
});

// ── Login ─────────────────────────────────────────────────
logger.info('Connecting to Discord…');
client.login(process.env.DISCORD_TOKEN);

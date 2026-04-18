/**
 * Run this script once to register slash commands with Discord.
 *
 * Guild deploy (instant):   npm run deploy
 * Global deploy (~1 hour):  npm run deploy:global
 */

import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { logger } from './utils/logger';

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

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  logger.error('DISCORD_TOKEN and CLIENT_ID must be set in .env');
  process.exit(1);
}

const commands = [
  announce, ban, kick, timeout, untimeout,
  warn, warnings, clearwarns,
  purge, slowmode, lock, unlock,
  status, release,
  userinfo, serverinfo,
  say, embed, nick, role,
].map(cmd => cmd.data.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  const isGlobal = process.env.GLOBAL_DEPLOY === 'true';

  if (!isGlobal && guildId) {
    logger.info(`Deploying ${commands.length} commands to guild ${guildId}…`);
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    logger.success(`Deployed ${commands.length} commands to guild ${guildId} (instant).`);
  } else {
    logger.info(`Deploying ${commands.length} commands globally…`);
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    logger.success(`Deployed ${commands.length} commands globally (takes up to 1 hour).`);
  }
})().catch(err => {
  logger.error('Deploy failed', err);
  process.exit(1);
});

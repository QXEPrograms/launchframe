import { Client, ActivityType } from 'discord.js';
import axios from 'axios';
import { logger } from '../utils/logger';
import { GitHubRelease } from '../types';

let cachedVersion = 'Unknown';
let lastCheck = 0;
const TTL = 30 * 60 * 1000;

export async function fetchLatestVersion(): Promise<string> {
  if (Date.now() - lastCheck < TTL && cachedVersion !== 'Unknown') return cachedVersion;

  try {
    const repo = process.env.GITHUB_REPO ?? 'qxeprograms/launchframe';
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'LaunchFrame-Discord-Bot',
    };
    if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;

    const { data } = await axios.get<GitHubRelease>(
      `https://api.github.com/repos/${repo}/releases/latest`,
      { headers, timeout: 10_000 }
    );

    cachedVersion = data.tag_name ?? 'Unknown';
    lastCheck = Date.now();
  } catch {
    // keep existing cache
  }

  return cachedVersion;
}

export function setupReady(client: Client): void {
  client.once('ready', async () => {
    if (!client.user) return;
    logger.success(`Logged in as ${client.user.tag}`);
    logger.info(`Guilds: ${client.guilds.cache.size}`);

    const version = await fetchLatestVersion();
    logger.info(`LaunchFrame latest: ${version}`);

    const activities = [
      () => ({ name: 'LaunchFrame', type: ActivityType.Watching }),
      () => ({ name: `${version} is live`, type: ActivityType.Playing }),
      () => {
        const count = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
        return { name: `${count.toLocaleString()} members`, type: ActivityType.Watching };
      },
    ];

    let i = 0;
    const rotate = () => {
      if (!client.user) return;
      client.user.setPresence({ status: 'online', activities: [activities[i % activities.length]()] });
      i++;
    };

    rotate();
    setInterval(rotate, 30_000);
    setInterval(async () => {
      const v = await fetchLatestVersion();
      // refresh cached version silently
      logger.info(`LaunchFrame version refreshed: ${v}`);
    }, TTL);
  });
}

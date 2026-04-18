# LaunchFrame Discord Bot

The official LaunchFrame Discord bot — full moderation, AutoMod, LaunchFrame app status, welcome messages, and 20 owner-only slash commands.

## Features

- **Owner-only commands** — every slash command is locked to your Discord user ID
- **Full moderation** — ban, kick, timeout, warn, purge, slowmode, lock/unlock channels
- **AutoMod** — blocks invite links, mass mentions, and spam (auto-timeout)
- **LaunchFrame status** — pull live release data from GitHub with download counts and buttons
- **Release announcements** — one-click `/release` to announce new versions
- **Welcome messages** — beautiful embed when new members join
- **Mod log** — all moderation actions posted to a dedicated channel
- **Warning system** — persistent JSON-based warn/clearwarns storage
- **Rotating status** — bot cycles between version, member count, and watching messages
- **20 slash commands** — see the full list below

## Commands

| Command | Description |
|---|---|
| `/announce` | Send a styled announcement embed with optional role ping |
| `/ban` | Ban a member, DMs them the reason first |
| `/kick` | Kick a member |
| `/timeout` | Timeout (mute) a member for 1 min to 28 days |
| `/untimeout` | Remove a member's timeout |
| `/warn` | Issue a warning to a member |
| `/warnings` | View all warnings for a member |
| `/clearwarns` | Clear all warnings for a member |
| `/purge` | Bulk delete up to 100 messages (optionally by user) |
| `/slowmode` | Set channel slowmode (0 to disable) |
| `/lock` | Lock a channel so @everyone can't send messages |
| `/unlock` | Unlock a channel |
| `/status` | Show the latest LaunchFrame release with download stats |
| `/release` | Announce the latest LaunchFrame release to a channel |
| `/userinfo` | Show detailed info about a user including warnings |
| `/serverinfo` | Show server statistics |
| `/say` | Make the bot send a message |
| `/embed` | Send a fully custom embed |
| `/nick` | Change a member's nickname |
| `/role` | Add or remove a role from a member |

## Setup

### 1. Create a Discord Application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Create a new application
3. Under **Bot**, create a bot and copy the token
4. Under **OAuth2**, note your **Client ID**
5. Enable **Privileged Gateway Intents**: Server Members, Message Content, Presence

### 2. Invite the Bot

Use this URL (replace `YOUR_CLIENT_ID`):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```
`permissions=8` grants Administrator (recommended for full moderation).

### 3. Configure Environment

```bash
cd discord-bot
cp .env.example .env
```

Fill in `.env`:
```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_client_id
OWNER_ID=your_discord_user_id        # Right-click yourself → Copy ID
GUILD_ID=your_server_id              # For fast command registration

WELCOME_CHANNEL_ID=channel_id        # Optional
MOD_LOG_CHANNEL_ID=channel_id        # Optional
ANNOUNCEMENT_CHANNEL_ID=channel_id  # Optional

GITHUB_REPO=qxeprograms/launchframe  # Already set correctly
GITHUB_TOKEN=optional_pat            # Optional, avoids API rate limits
```

> **How to find your user ID:** Enable Developer Mode in Discord (Settings → Advanced → Developer Mode), then right-click your username → Copy User ID.

### 4. Install & Deploy

```bash
npm install
npm run deploy        # Register commands to your guild (instant)
npm run dev           # Start the bot in dev mode
```

For production:
```bash
npm run build
npm start
```

## AutoMod Rules

The bot automatically moderates messages from non-admins:

| Trigger | Action |
|---|---|
| Discord invite links | Delete message + warn |
| 5+ user mentions or @everyone/@here | Delete message + warn |
| 5 messages in 5 seconds (spam) | 5-minute timeout + warn |

The bot owner and users with **Manage Messages** permission are immune to AutoMod.

## Architecture

```
discord-bot/
├── src/
│   ├── index.ts              # Client setup, command loading, event setup
│   ├── deploy-commands.ts    # One-time command registration script
│   ├── types.ts              # Shared TypeScript types
│   ├── commands/             # One file per slash command
│   ├── events/               # Discord event handlers
│   └── utils/
│       ├── embeds.ts         # Embed builder helpers + color palette
│       ├── logger.ts         # Colorized console logger
│       ├── permissions.ts    # Owner check helper
│       └── dataManager.ts    # JSON-based warning storage
└── data/
    └── warnings.json         # Auto-generated, gitignored
```

# AppleBlox

The better way to run Roblox on macOS — a full-featured Roblox launcher inspired by Bloxstrap, built natively for Mac.

## Features

| Feature | Description |
|---|---|
| **Fast Flags** | Edit Roblox client flags with one-click presets (FPS unlock, Metal GPU, fullbright, etc.) |
| **Discord Rich Presence** | Shows your current game on Discord, with elapsed time and a "View Game" button |
| **Activity Tracker** | Tracks every session — playtime, game history, and live status |
| **Discord Webhooks** | Get notified in a Discord channel when you join/leave a game |
| **Behavior Settings** | Launch at login, close-to-tray, multi-instance, custom launch args |
| **Menu Bar** | Runs quietly in the macOS menu bar — launch Roblox from anywhere |
| **macOS Native** | Vibrancy/blur, traffic-light window controls, SF Pro font, system colors |

## Requirements

- macOS 12 Monterey or later
- Node.js 18+
- Roblox installed at `/Applications/Roblox.app`

## Quick Start

```bash
cd ~/appleblox
npm install
npm run dev
```

## Build a distributable .dmg

```bash
npm run dist
```

The output will be in `dist/`.

## Project Structure

```
src/
├── main/                  # Electron main process
│   ├── index.ts           # App entry, IPC handlers, tray
│   └── roblox/
│       ├── bootstrapper.ts    # Roblox install/launch
│       ├── fastflags.ts       # Flag file manager + presets
│       ├── activityTracker.ts # Log watcher + session recorder
│       └── discordRPC.ts      # Discord Rich Presence
├── preload/
│   └── index.ts           # Context bridge (renderer ↔ main IPC)
└── renderer/src/
    ├── App.tsx             # Root component + navigation
    ├── components/
    │   └── Sidebar.tsx     # Nav sidebar
    └── pages/
        ├── HomePage.tsx        # Launch + stats
        ├── FastFlagsPage.tsx   # Flags editor + presets
        ├── IntegrationsPage.tsx # Discord RPC + webhooks
        ├── BehaviorPage.tsx    # Launch behavior
        └── SettingsPage.tsx    # App settings + about
```

## How Fast Flags work

Flags are written to:
```
~/Library/Preferences/Roblox/ClientAppSettings.json
```
They take effect on the next Roblox launch. AppleBlox never modifies the Roblox binary.

## How Activity Tracking works

AppleBlox watches `~/Library/Logs/Roblox/*.log` for game join/leave events.
No data is sent anywhere — everything is stored locally in:
```
~/Library/Application Support/appleblox/activity.json
```

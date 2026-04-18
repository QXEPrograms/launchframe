import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Warning, WarningsData } from '../types';

const DATA_DIR = path.join(process.cwd(), 'data');
const WARNINGS_FILE = path.join(DATA_DIR, 'warnings.json');

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read(): WarningsData {
  ensureDir();
  if (!fs.existsSync(WARNINGS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(WARNINGS_FILE, 'utf-8')) as WarningsData;
  } catch {
    return {};
  }
}

function write(data: WarningsData): void {
  ensureDir();
  fs.writeFileSync(WARNINGS_FILE, JSON.stringify(data, null, 2));
}

export const DataManager = {
  addWarning(guildId: string, userId: string, reason: string, moderatorId: string): Warning {
    const data = read();
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) data[guildId][userId] = [];

    const warning: Warning = { id: uuidv4(), reason, timestamp: Date.now(), moderatorId };
    data[guildId][userId].push(warning);
    write(data);
    return warning;
  },

  getWarnings(guildId: string, userId: string): Warning[] {
    return read()[guildId]?.[userId] ?? [];
  },

  clearWarnings(guildId: string, userId: string): number {
    const data = read();
    const count = data[guildId]?.[userId]?.length ?? 0;
    if (data[guildId]) data[guildId][userId] = [];
    write(data);
    return count;
  },

  removeWarning(guildId: string, userId: string, warningId: string): boolean {
    const data = read();
    if (!data[guildId]?.[userId]) return false;
    const before = data[guildId][userId].length;
    data[guildId][userId] = data[guildId][userId].filter(w => w.id !== warningId);
    write(data);
    return data[guildId][userId].length < before;
  },
};

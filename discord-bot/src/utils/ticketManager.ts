import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');

export interface TicketConfig {
  categoryId?: string;
  supportRoleId?: string;
}

export interface TicketRecord {
  userId: string;
  username: string;
  number: number;
  createdAt: number;
}

interface TicketsFile {
  config: Record<string, TicketConfig>;
  tickets: Record<string, {
    nextNumber: number;
    open: Record<string, TicketRecord>; // channelId → record
    byUser: Record<string, string>;      // userId → channelId
  }>;
}

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read(): TicketsFile {
  ensureDir();
  if (!fs.existsSync(TICKETS_FILE)) return { config: {}, tickets: {} };
  try {
    return JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf-8')) as TicketsFile;
  } catch {
    return { config: {}, tickets: {} };
  }
}

function write(data: TicketsFile): void {
  ensureDir();
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(data, null, 2));
}

export const TicketManager = {
  getConfig(guildId: string): TicketConfig {
    return read().config[guildId] ?? {};
  },

  setConfig(guildId: string, config: Partial<TicketConfig>): void {
    const data = read();
    data.config[guildId] = { ...(data.config[guildId] ?? {}), ...config };
    write(data);
  },

  openTicket(guildId: string, channelId: string, userId: string, username: string): TicketRecord {
    const data = read();
    if (!data.tickets[guildId]) {
      data.tickets[guildId] = { nextNumber: 1, open: {}, byUser: {} };
    }
    const g = data.tickets[guildId];
    const record: TicketRecord = { userId, username, number: g.nextNumber++, createdAt: Date.now() };
    g.open[channelId] = record;
    g.byUser[userId] = channelId;
    write(data);
    return record;
  },

  closeTicket(guildId: string, channelId: string): TicketRecord | null {
    const data = read();
    const g = data.tickets[guildId];
    if (!g) return null;
    const record = g.open[channelId];
    if (!record) return null;
    delete g.open[channelId];
    delete g.byUser[record.userId];
    write(data);
    return record;
  },

  getTicketByChannel(guildId: string, channelId: string): TicketRecord | null {
    return read().tickets[guildId]?.open[channelId] ?? null;
  },

  getUserTicketChannel(guildId: string, userId: string): string | null {
    return read().tickets[guildId]?.byUser[userId] ?? null;
  },
};

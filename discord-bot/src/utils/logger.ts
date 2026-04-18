const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function ts(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function tag(label: string, color: string): string {
  return `${color}${c.bright}[${label}]${c.reset}`;
}

export const logger = {
  info: (msg: string) =>
    console.log(`${c.gray}${ts()}${c.reset} ${tag('INFO', c.cyan)} ${msg}`),

  success: (msg: string) =>
    console.log(`${c.gray}${ts()}${c.reset} ${tag(' OK ', c.green)} ${msg}`),

  warn: (msg: string) =>
    console.warn(`${c.gray}${ts()}${c.reset} ${tag('WARN', c.yellow)} ${msg}`),

  error: (msg: string, err?: unknown) => {
    console.error(`${c.gray}${ts()}${c.reset} ${tag('ERR ', c.red)} ${msg}`);
    if (err) console.error(err);
  },

  command: (name: string, user: string, guild: string) =>
    console.log(
      `${c.gray}${ts()}${c.reset} ${tag(' CMD', c.magenta)} ` +
      `${c.bright}/${name}${c.reset} by ${c.cyan}${user}${c.reset} in ${c.blue}${guild}${c.reset}`
    ),
};

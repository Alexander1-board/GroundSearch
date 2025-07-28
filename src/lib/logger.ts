// path: src/lib/logger.ts
const levels: { [key: string]: number } = { error: 0, warn: 1, info: 2, debug: 3 };
const lvlKey = String(process.env.LOG_LEVEL ?? 'info').toLowerCase();
const currentLevel = levels[lvlKey] ?? 2;

function out(levelKey: keyof typeof levels, message: string, data?: Record<string, any>) {
  if (levels[levelKey] <= currentLevel) {
    const ts = new Date().toISOString();
    const rec: any = { ts, level: (levelKey as string).toUpperCase(), msg: message };
    if (data) rec.data = data;
    try { console.log(JSON.stringify(rec)); } 
    catch { console.log(ts, `[${levelKey}]`, message); }
  }
}

export const logger = {
  error: (m: string, d?: object) => out('error', m, d as any),
  warn:  (m: string, d?: object) => out('warn',  m, d as any),
  info:  (m: string, d?: object) => out('info',  m, d as any),
  debug: (m: string, d?: object) => out('debug', m, d as any),
};

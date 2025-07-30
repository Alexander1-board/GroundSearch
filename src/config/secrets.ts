import { promises as fs } from 'fs';
import path from 'path';

const SECRET_PATH = path.resolve(process.cwd(), '.data/secrets.json');

export interface Secrets {
  [key: string]: string;
}

export async function loadSecrets(): Promise<Secrets> {
  try {
    const txt = await fs.readFile(SECRET_PATH, 'utf8');
    const obj = JSON.parse(txt) as Secrets;
    for (const [k, v] of Object.entries(obj)) {
      if (!process.env[k]) process.env[k] = v;
    }
    return obj;
  } catch {
    return {};
  }
}

export async function saveSecrets(sec: Secrets): Promise<void> {
  await fs.mkdir(path.dirname(SECRET_PATH), { recursive: true });
  await fs.writeFile(SECRET_PATH, JSON.stringify(sec, null, 2), { mode: 0o600 });
}

export function presenceFlags(keys: string[]): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const k of keys) {
    out[k] = !!(process.env[k] || process.env[k + '_SECRET']);
  }
  return out;
}

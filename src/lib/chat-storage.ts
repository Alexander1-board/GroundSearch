import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';

const RUNS_DIR = process.env.RUNS_DIR || path.resolve(process.cwd(), 'runs');

function sessionDir(id: string){
  return path.join(RUNS_DIR, id);
}

function chatFile(id: string){
  return path.join(sessionDir(id), 'chat.ndjson');
}

export async function appendMessage(sessionId: string, msg: any){
  await fs.mkdir(sessionDir(sessionId), { recursive: true });
  const line = JSON.stringify({ ...msg, ts: Date.now() }) + '\n';
  await fs.appendFile(chatFile(sessionId), line);
}

export async function getMessages(sessionId: string): Promise<any[]> {
  try {
    const txt = await fs.readFile(chatFile(sessionId), 'utf8');
    return txt.split('\n').filter(Boolean).map(l => JSON.parse(l));
  } catch {
    return [];
  }
}

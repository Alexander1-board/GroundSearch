// path: src/lib/run-storage.ts
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { logger } from './logger.js';

export interface RunEvent { type: string; ts: number; [k: string]: any; }

const RUNS_DIR = process.env.RUNS_DIR || path.resolve(process.cwd(), 'runs');

function safeId(id: string){ return id.replace(/[^a-zA-Z0-9._-]/g, '_'); }
function runDir(runId: string){ return path.join(RUNS_DIR, safeId(runId)); }
function eventsFile(runId: string){ return path.join(runDir(runId), 'events.ndjson'); }
function artifactsDir(runId: string){ return path.join(runDir(runId), 'artifacts'); }

async function ensureBase(runId: string){
  await fs.mkdir(runDir(runId), { recursive: true });
  await fs.mkdir(artifactsDir(runId), { recursive: true });
  try{ await fs.access(eventsFile(runId)); } catch{ await fs.writeFile(eventsFile(runId), ''); }
}

const queues = new Map<string, Promise<void>>();
function enqueue(runId: string, task: () => Promise<void>){
  const prev = queues.get(runId) ?? Promise.resolve();
  const next = prev.then(task).catch(e=>{
    logger.error('run-storage write error', { runId, error: String(e) });
    throw e;
  }).finally(()=>{ if(queues.get(runId) === next) queues.delete(runId); });
  queues.set(runId, next);
  return next;
}

export async function create(runId: string){
  await ensureBase(runId);
  await appendEvent(runId, { type: 'created', ts: Date.now() });
}

export async function appendEvent(runId: string, event: RunEvent){
  await ensureBase(runId);
  const line = JSON.stringify({ ...event, ts: event.ts ?? Date.now() }) + '\n';
  await enqueue(runId, async () => { await fs.appendFile(eventsFile(runId), line, 'utf8'); });
}

export async function getEvents(runId: string): Promise<RunEvent[]>{
  try{
    const text = await fs.readFile(eventsFile(runId), 'utf8');
    return text.split('\n').filter(Boolean).map(l=>{ try{ return JSON.parse(l); } catch{ return null as any; }}).filter(Boolean);
  }catch{ return []; }
}

export async function saveArtifact(runId: string, name: string, data: string|Buffer|object): Promise<string>{
  await ensureBase(runId);
  const outPath = path.join(artifactsDir(runId), safeId(name));
  const payload = (typeof data === 'string' || Buffer.isBuffer(data)) ? data : JSON.stringify(data, null, 2);
  await enqueue(runId, async () => { await fs.writeFile(outPath, payload as any); });
  return path.relative(process.cwd(), outPath);
}

export async function getArtifact(runId: string, name: string): Promise<any|null>{
  const filePath = path.join(artifactsDir(runId), safeId(name));
  try{
    const content = await fs.readFile(filePath, 'utf8');
    if (filePath.toLowerCase().endsWith('.json')) return JSON.parse(content);
    return content;
  }catch(e:any){
    if (e?.code === 'ENOENT') return null;
    throw e;
  }
}

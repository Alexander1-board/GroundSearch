import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import { apiRouter } from '../src/routes.js';
import * as runStorage from '../src/lib/run-storage.js';
import { promises as fs } from 'fs';
import path from 'path';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);
const request = supertest(app);
const RUNS_DIR = path.resolve(process.cwd(), 'runs');

async function waitDone(id:string, timeout=15000){
  const start = Date.now();
  while(Date.now()-start<timeout){
    const ev = await runStorage.getEvents(id).catch(()=>[]);
    if(ev.some(e=>e.type==='complete')) return true;
    await new Promise(r=>setTimeout(r,500));
  }
  return false;
}

describe.skip('End-to-end flow', () => {
  let runId:string;

  beforeAll(async () => {
    await fs.rm(RUNS_DIR, {recursive:true, force:true});
    await fs.mkdir(RUNS_DIR, {recursive:true});
  });

  it('creates brief via interview', async () => {
    const start = await request.post('/api/chat/start').send().expect(200);
    const sessionId = start.body.sessionId;
    await request.post(`/api/chat/${sessionId}/reply`).send({ message:'Study obesity treatments' }).expect(200);
    const final = await request.post('/api/interview/finalise').send({ sessionId }).expect(200);
    expect(final.body.objective).toBeDefined();
    const preview = await request.post('/api/plan/preview').send({ brief: final.body }).expect(200);
    expect(preview.body.steps.length).toBeGreaterThan(0);
    const run = await request.post('/api/agent/start').send({ brief: final.body }).expect(200);
    runId = run.body.runId;
    expect(runId).toBeDefined();
  });

  it('streams events and exports report', async () => {
    expect(await waitDone(runId)).toBe(true);
    const rep = await request.post('/api/report/generate').send({ runId }).expect(200);
    const res = await request.post(`/api/report/export?runId=${runId}&format=md`).expect(200);
    expect(res.headers['content-type']).toMatch(/text\/markdown/);
    expect(rep.body.markdown).toBeTypeOf('string');
  });
});

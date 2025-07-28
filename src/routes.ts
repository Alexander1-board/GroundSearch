// path: src/routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ResearchBriefSchema } from './spec/schemas.js';
import { finaliseInterview } from './agents/interview.js';
import { createExecutionPlan } from './agents/orchestrator.js';
import { startExecution, eventEmitter } from './dispatcher.js';
import { getLLM } from './providers/registry.js';
import { MockLLMClient } from './types/llm.js';
import { loadConfig, saveConfig } from './config/user-config.js';
import { availableProviders } from './providers/registry.js';
import { startSession, replySession } from './agents/conversation.js';
import { getMessages } from './lib/chat-storage.js';
import * as runStorage from './lib/run-storage.js';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './lib/logger.js';

export const apiRouter = Router();

apiRouter.get('/config', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json(await loadConfig()); } catch(e){ next(e); }
});

apiRouter.put('/config', async (req: Request, res: Response, next: NextFunction) => {
  try { await saveConfig(req.body); res.json({ ok: true }); } catch(e){ next(e); }
});

apiRouter.get('/providers', async (_req: Request, res: Response) => {
  res.json({ providers: availableProviders() });
});

apiRouter.post('/providers/test', async (_req: Request, res: Response) => {
  res.json({ ok: true });
});

apiRouter.post('/chat/start', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cfg = await loadConfig();
    const llm = getLLM(cfg.default_provider as any, cfg.default_model);
    const out = await startSession(llm);
    res.json(out);
  } catch(e){ next(e); }
});

apiRouter.post('/chat/:sessionId/reply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body ?? {};
    const cfg = await loadConfig();
    const llm = getLLM(cfg.default_provider as any, cfg.default_model);
    const out = await replySession(sessionId, message, llm);
    res.json(out);
  } catch(e){ next(e); }
});

apiRouter.get('/chat/:sessionId/stream', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const msgs = await getMessages(sessionId);
    res.writeHead(200, { 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache', 'Connection':'keep-alive' });
    for (const m of msgs){
      res.write(`data: ${JSON.stringify(m)}\n\n`);
    }
    const ka = setInterval(()=>res.write(':\n\n'),15000);
    req.on('close', ()=>clearInterval(ka));
  } catch(e){ next(e); }
});

apiRouter.post('/interview/finalise', async (req: Request, res: Response, next: NextFunction) => {
  try{
    const { transcript, current_outline, sessionId } = req.body ?? {};
    const cfg = await loadConfig();
    const llm = getLLM(cfg.default_provider as any, cfg.default_model);
    const chat = sessionId ? await getMessages(sessionId) : transcript || [];
    const brief = await finaliseInterview(chat as any, current_outline || {}, llm);
    res.json(brief);
  }catch(e){ next(e); }
});

apiRouter.post('/agent/start', async (req: Request, res: Response, next: NextFunction) => {
  try{
    const { brief, model } = req.body ?? {};
    const validated = ResearchBriefSchema.parse(brief);
    const runId = uuidv4();
    const cfg = await loadConfig();
    const llm = getLLM(cfg.default_provider as any, model || cfg.default_model);
    const plan = await createExecutionPlan(validated, llm);
    await runStorage.create(runId);
    logger.info('run created', { runId });
    await runStorage.saveArtifact(runId, 'execution-plan.json', plan);
    // Start async
    startExecution(runId, plan, llm, validated).catch(()=>{});
    res.json({ runId });
  }catch(e){ next(e); }
});

apiRouter.get('/agent/:runId/stream', async (req: Request, res: Response, next: NextFunction) => {
  try{
    const { runId } = req.params;
    logger.info('sse connect', { runId });
    res.writeHead(200, { 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache', 'Connection':'keep-alive' });
    // replay
    const past = await runStorage.getEvents(runId);
    for (const evt of past){
      res.write(`event: ${evt.type}\n`);
      res.write(`data: ${JSON.stringify(evt)}\n\n`);
    }
    const ka = setInterval(()=>res.write(':\n\n'), 15000);
    const handler = (evt: any)=>{ res.write(`event: ${evt.type}\n`); res.write(`data: ${JSON.stringify(evt)}\n\n`); };
    eventEmitter.on(runId, handler);
    req.on('close', ()=>{ clearInterval(ka); eventEmitter.off(runId, handler); logger.info('sse disconnect', { runId }); });
  }catch(e){ next(e); }
});

apiRouter.get('/runs', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dir = path.resolve(process.cwd(), 'runs');
    const ids = await fs.readdir(dir).catch(() => []);
    const runs = await Promise.all(ids.map(async id => {
      const events = await runStorage.getEvents(id);
      const status = events.some(e => e.type === 'error') ? 'error' : events.some(e => e.type === 'complete') ? 'complete' : 'running';
      const updatedAt = events.length ? events[events.length - 1].ts : undefined;
      return { runId: id, status, updatedAt };
    }));
    res.json({ runs });
  } catch(e){ next(e); }
});

apiRouter.get('/agent/:runId/plan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { runId } = req.params;
    const plan = await runStorage.getArtifact(runId, 'execution-plan.json');
    if (plan) return res.json(plan);
    res.status(404).json({ error: 'plan not found' });
  } catch(e){ next(e); }
});

apiRouter.post('/report/generate', async (req: Request, res: Response, next: NextFunction) => {
  try{
    const { runId } = req.body ?? {};
    const report = await runStorage.getArtifact(runId, 'final-report.json');
    if (report) return res.json(report);
    const events = await runStorage.getEvents(runId).catch(()=>[]);
    const done = events.some(e=>e.type==='complete' || e.type==='error');
    if (done) return res.status(404).json({ error: 'Final report artifact not found for this completed run.' });
    return res.status(202).json({ message: 'Research run is not yet complete or has failed.' });
  }catch(e){ next(e); }
});

apiRouter.get('/report/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { runId, format } = req.query as any;
    const report = await runStorage.getArtifact(runId, 'final-report.json');
    if (!report) return res.status(404).json({ error: 'not found' });
    if (format === 'json') return res.json(report);
    res.setHeader('Content-Type','text/markdown');
    res.send(report.markdown);
  } catch(e){ next(e); }
});

export default apiRouter;

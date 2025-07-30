// path: src/routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ResearchBriefSchema } from './spec/schemas.js';
import { finaliseInterview } from './agents/interview.js';
import { createExecutionPlan } from './agents/orchestrator.js';
import { startExecution, eventEmitter } from './dispatcher.js';
import { generateReport } from './agents/synthesis.js';
import { getLLM, availableProviders } from './providers/registry.js';
import { z } from 'zod';
import { loadConfig, saveConfig } from './config/user-config.js';
import { loadSecrets, saveSecrets, presenceFlags } from './config/secrets.js';
import { startSession, replySession } from './agents/conversation.js';
import { getMessages } from './lib/chat-storage.js';
import * as runStorage from './lib/run-storage.js';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './lib/logger.js';

export const apiRouter = Router();

const PROVIDER_MODELS: Record<string, string[]> = {
  gemini: ['gemini-2.5-flash'],
  openai: ['gpt-4o-mini'],
  anthropic: ['claude-3-haiku'],
  grok: ['grok-beta'],
  ollama: ['llama3'],
  mock: ['mock-model']
};

apiRouter.get('/config', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json(await loadConfig()); } catch(e){ next(e); }
});

apiRouter.put('/config', async (req: Request, res: Response, next: NextFunction) => {
  try { await saveConfig(req.body); res.json({ ok: true }); } catch(e){ next(e); }
});

apiRouter.get('/config/secrets', async (_req: Request, res: Response) => {
  await loadSecrets();
  const flags = presenceFlags([
    'OPENAI_API_KEY','ANTHROPIC_API_KEY','GEMINI_API_KEY','GROK_API_KEY',
    'OLLAMA_BASE_URL','NCBI_API_KEY','WOLFRAM_APPID','OPENALEX_EMAIL'
  ]);
  res.json({ canEdit: process.env.NODE_ENV !== 'production', flags });
});

apiRouter.put('/config/secrets', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'forbidden' });
  const current = await loadSecrets();
  for (const [k,v] of Object.entries(req.body ?? {})) {
    if (v) current[k] = String(v); else delete current[k];
  }
  await saveSecrets(current);
  res.json({ ok: true });
});

apiRouter.get('/providers', async (_req: Request, res: Response) => {
  const avail = availableProviders();
  const providers = Object.entries(PROVIDER_MODELS).map(([id, models]) => ({
    id,
    models,
    available: avail.includes(id as any)
  }));
  res.json({ providers });
});

apiRouter.post('/providers/test', async (req: Request, res: Response) => {
  const { provider, model } = req.body ?? {};
  try {
    const llm = getLLM(provider as any, model || '');
    const schema = z.object({ ok: z.boolean() });
    await llm.generateJSON('return {"ok":true}', schema, { mockData: { ok: true } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: String(e?.message || e) });
  }
});

apiRouter.post('/chat/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cfg = await loadConfig();
    const { provider, model } = req.body ?? {};
    const llm = getLLM((provider || cfg.default_provider) as any, model || cfg.default_model);
    const out = await startSession(llm);
    res.json(out);
  } catch(e){ next(e); }
});

apiRouter.post('/chat/:sessionId/reply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { message, provider, model } = req.body ?? {};
    const cfg = await loadConfig();
    const llm = getLLM((provider || cfg.default_provider) as any, model || cfg.default_model);
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
    const { sessionId } = req.body ?? {};
    if(!sessionId) return res.status(400).json({ error: 'sessionId required' });
    const brief = await finaliseInterview(sessionId);
    res.json(brief);
  }catch(e){ next(e); }
});

apiRouter.post('/plan/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brief, model, provider } = req.body ?? {};
    const validated = ResearchBriefSchema.parse(brief);
    const cfg = await loadConfig();
    const llm = getLLM((provider || cfg.default_provider) as any, model || cfg.default_model);
    const plan = await createExecutionPlan(validated, llm);
    res.json(plan);
  } catch(e){ next(e); }
});

apiRouter.post('/agent/start', async (req: Request, res: Response, next: NextFunction) => {
  try{
    const { brief, model, provider } = req.body ?? {};
    const validated = ResearchBriefSchema.parse(brief);
    const runId = uuidv4();
    const cfg = await loadConfig();
    const llm = getLLM((provider || cfg.default_provider) as any, model || cfg.default_model);
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
    const closeOnComplete = req.query.closeOnComplete === '1';
    logger.info('sse connect', { runId });
    res.writeHead(200, { 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache', 'Connection':'keep-alive' });
    const past = await runStorage.getEvents(runId);
    for (const evt of past){
      res.write(`event: ${evt.type}\n`);
      res.write(`data: ${JSON.stringify(evt)}\n\n`);
    }
    if (closeOnComplete && past.some(e => e.type === 'complete')) {
      return res.end();
    }
    const ka = setInterval(()=>res.write(':\n\n'), 15000);
    const handler = (evt: any)=>{
      res.write(`event: ${evt.type}\n`);
      res.write(`data: ${JSON.stringify(evt)}\n\n`);
      if(closeOnComplete && evt.type==='complete'){ cleanup(); res.end(); }
    };
    const cleanup = ()=>{ clearInterval(ka); eventEmitter.off(runId, handler); }; 
    eventEmitter.on(runId, handler);
    req.on('close', ()=>{ cleanup(); logger.info('sse disconnect', { runId }); });
  }catch(e){ next(e); }
});

apiRouter.get('/runs', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dir = path.resolve(process.cwd(), 'runs');
    const ids = await fs.readdir(dir).catch(() => []);
    const runs = await Promise.all(ids.map(async id => {
      const events = await runStorage.getEvents(id);
      const status = events.some(e => e.type === 'error')
        ? 'error'
        : events.some(e => e.type === 'complete')
          ? 'complete'
          : 'running';
      const updatedAt = events.length ? events[events.length - 1].ts : undefined;
      const created = events.find(e => e.type === 'created');
      return { runId: id, status, updatedAt, startedAt: created?.ts };
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
    const { runId, provider, model } = req.body ?? {};
    if(!runId) return res.status(400).json({ error: 'runId required' });
    let report = await runStorage.getArtifact(runId, 'final-report.json');
    if(!report){
      const evidence = await runStorage.getArtifact(runId, 'screened-evidence.json');
      if(!evidence) return res.status(404).json({ error: 'screened evidence missing' });
      const cfg = await loadConfig();
      const llm = getLLM((provider || cfg.default_provider) as any, model || cfg.default_model);
      report = await generateReport(runId, llm, evidence);
      await runStorage.saveArtifact(runId, 'final-report.json', report);
    }
    res.json(report);
  }catch(e){ next(e); }
});

apiRouter.post('/report/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { runId, format } = { ...req.query, ...req.body } as any;
    const report = await runStorage.getArtifact(runId, 'final-report.json');
    if (!report) return res.status(404).json({ error: 'not found' });
    if (format === 'json') {
      res.setHeader('Content-Type','application/json');
      res.setHeader('Content-Disposition','attachment; filename="report.json"');
      return res.send(JSON.stringify(report, null, 2));
    }
    res.setHeader('Content-Type','text/markdown');
    res.setHeader('Content-Disposition','attachment; filename="report.md"');
    res.send(report.markdown);
  } catch(e){ next(e); }
});

export default apiRouter;

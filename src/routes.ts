// path: src/routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ResearchBriefSchema } from './spec/schemas.js';
import { finaliseInterview } from './agents/interview.js';
import { createExecutionPlan } from './agents/orchestrator.js';
import { startExecution, eventEmitter } from './dispatcher.js';
import { MockLLMClient } from './types/llm.js';
import * as runStorage from './lib/run-storage.js';

export const apiRouter = Router();

apiRouter.post('/interview/finalise', async (req: Request, res: Response, next: NextFunction) => {
  try{
    const { transcript, current_outline } = req.body ?? {};
    const llm = new MockLLMClient('gemini','gemini-2.5-flash');
    const brief = await finaliseInterview(transcript || [], current_outline || {}, llm);
    res.json(brief);
  }catch(e){ next(e); }
});

apiRouter.post('/agent/start', async (req: Request, res: Response, next: NextFunction) => {
  try{
    const { brief, model } = req.body ?? {};
    const validated = ResearchBriefSchema.parse(brief);
    const runId = uuidv4();
    const llm = new MockLLMClient('gemini', model || 'gemini-2.5-flash');
    const plan = await createExecutionPlan(validated, llm);
    await runStorage.create(runId);
    await runStorage.saveArtifact(runId, 'execution-plan.json', plan);
    // Start async
    startExecution(runId, plan, llm, validated).catch(()=>{});
    res.json({ runId });
  }catch(e){ next(e); }
});

apiRouter.get('/agent/:runId/stream', async (req: Request, res: Response, next: NextFunction) => {
  try{
    const { runId } = req.params;
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
    req.on('close', ()=>{ clearInterval(ka); eventEmitter.off(runId, handler); });
  }catch(e){ next(e); }
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

export default apiRouter;

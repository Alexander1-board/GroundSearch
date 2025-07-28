// path: src/dispatcher.ts
import { EventEmitter } from 'events';
import { ExecutionPlan, ActionStep, RecordLite, Evidence, ResearchBrief } from './spec/schemas.js';
import { LLMClient } from './types/llm.js';
import * as runStorage from './lib/run-storage.js';
import { logger } from './lib/logger.js';
import { searchPubMed } from './adapters/pubmed.js';
import { searchArxiv } from './adapters/arxiv.js';
import { screenRecords } from './agents/screening.js';
import { generateReport } from './agents/synthesis.js';

export const eventEmitter = new EventEmitter();

async function emitEvent(runId: string, type: string, data: any){
  const evt = { type, ts: Date.now(), ...data };
  await runStorage.appendEvent(runId, evt);
  eventEmitter.emit(runId, evt);
}

async function executeStep(runId: string, step: ActionStep, llm: LLMClient, brief: ResearchBrief){
  await emitEvent(runId, 'step_start', { stepId: step.id, action: step.action, agent: step.agent });
  switch(step.action){
    case 'SEARCH': {
      let results: RecordLite[] = [];
      if (step.agent === 'pubmed_agent') results = await searchPubMed(brief.objective, step.params?.retmax ?? 50);
      if (step.agent === 'arxiv_agent') results = await searchArxiv(brief.objective, step.params?.max_results ?? 50);
      const path = await runStorage.saveArtifact(runId, `${step.id}-results.json`, results);
      await emitEvent(runId, 'artifact', { stepId: step.id, path });
      break;
    }
    case 'SCREEN': {
      // Load previous search artifacts if present
      let collected: RecordLite[] = [];
      for (const k of ['s1-results.json','s2-results.json']) {
        const a = await runStorage.getArtifact(runId, k);
        if (Array.isArray(a)) collected = collected.concat(a as any);
      }
      const screened = await screenRecords(collected);
      const path = await runStorage.saveArtifact(runId, 'screened-evidence.json', screened);
      await emitEvent(runId, 'artifact', { stepId: step.id, path });
      break;
    }
    case 'SYNTHESISE': {
      const ev = await runStorage.getArtifact(runId, 'screened-evidence.json') as Evidence[];
      const output = await generateReport(runId, llm, Array.isArray(ev)?ev:[]);
      const path = await runStorage.saveArtifact(runId, 'final-report.json', output);
      await emitEvent(runId, 'artifact', { stepId: step.id, path });
      break;
    }
    default:
      logger.warn('Unknown step action', { action: step.action });
  }
}

export async function startExecution(runId: string, plan: ExecutionPlan, llm: LLMClient, brief?: ResearchBrief){
  await runStorage.create(runId);
  await emitEvent(runId, 'phase', { phase: 'start' });
  for (const step of plan.steps){
    await executeStep(runId, step, llm, brief as any);
  }
  await emitEvent(runId, 'complete', { ok: true });
}

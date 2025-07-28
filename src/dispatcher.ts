// path: src/dispatcher.ts
import { EventEmitter } from 'events';
import { ExecutionPlan, ActionStep, RecordLite, Evidence, ResearchBrief } from './spec/schemas.js';
import { LLMClient } from './types/llm.js';
import * as runStorage from './lib/run-storage.js';
import { logger } from './lib/logger.js';
import { searchPubMed } from './adapters/pubmed.js';
import { searchArxiv } from './adapters/arxiv.js';
import { searchMediaWiki } from './adapters/mediawiki.js';
import { queryWolfram } from './adapters/wolfram.js';
import path from 'path';
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
      if (step.agent === 'pubmed_agent') {
        await emitEvent(runId, 'api_call', { agent: step.agent, url: 'pubmed' });
        results = await searchPubMed(brief.objective, step.params?.retmax ?? 50);
      }
      if (step.agent === 'arxiv_agent') {
        await emitEvent(runId, 'api_call', { agent: step.agent, url: 'arxiv' });
        results = await searchArxiv(brief.objective, step.params?.max_results ?? 50);
      }
      if (step.agent === 'mediawiki_agent') {
        await emitEvent(runId, 'api_call', { agent: step.agent, url: 'mediawiki' });
        results = await searchMediaWiki(brief.objective, step.params?.limit ?? 5);
      }
      if (step.agent === 'wolfram_agent') {
        await emitEvent(runId, 'api_call', { agent: step.agent, url: 'wolfram' });
        const res = await queryWolfram(step.params?.input || brief.objective);
        results = res.pods.map((p, idx) => ({
          id: String(idx),
          source_id: 'wolfram',
          title: p.title,
          url: 'https://www.wolframalpha.com/',
          year: undefined,
          authors: [],
          abstract: p.plaintext
        }));
      }
      const artifactPath = await runStorage.saveArtifact(runId, `${step.id}-results.json`, results);
      await emitEvent(runId, 'artifact', { stepId: step.id, path: artifactPath });
      await emitEvent(runId, 'stats', { stepId: step.id, count: results.length });
      break;
    }
    case 'SCREEN': {
      // Load all SEARCH step artifacts
      let collected: RecordLite[] = [];
      const events = await runStorage.getEvents(runId);
      const searchSteps = events.filter(e => e.type === 'artifact' && String(e.path).includes('-results.json'));
      for (const s of searchSteps) {
        const name = path.basename(s.path);
        const a = await runStorage.getArtifact(runId, name);
        if (Array.isArray(a)) collected = collected.concat(a as any);
      }
      const screened = await screenRecords(collected);
      const artifactPath = await runStorage.saveArtifact(runId, 'screened-evidence.json', screened);
      await emitEvent(runId, 'artifact', { stepId: step.id, path: artifactPath });
      await emitEvent(runId, 'stats', { stepId: step.id, count: screened.length });
      break;
    }
    case 'SYNTHESISE': {
      const ev = await runStorage.getArtifact(runId, 'screened-evidence.json') as Evidence[];
      const output = await generateReport(runId, llm, Array.isArray(ev)?ev:[]);
      const artifactPath = await runStorage.saveArtifact(runId, 'final-report.json', output);
      await emitEvent(runId, 'artifact', { stepId: step.id, path: artifactPath });
      break;
    }
    default:
      logger.warn('Unknown step action', { action: step.action });
  }
}

export async function startExecution(runId: string, plan: ExecutionPlan, llm: LLMClient, brief?: ResearchBrief){
  await runStorage.create(runId);
  await emitEvent(runId, 'phase', { phase: 'start' });
  try {
    for (const step of plan.steps){
      try {
        await executeStep(runId, step, llm, brief as any);
      } catch (e:any) {
        await emitEvent(runId, 'error', { stepId: step.id, message: String(e) });
        await emitEvent(runId, 'complete', { ok: false });
        return;
      }
    }
    await emitEvent(runId, 'complete', { ok: true });
  } catch (e:any) {
    await emitEvent(runId, 'error', { message: String(e) });
    await emitEvent(runId, 'complete', { ok: false });
  }
}

// path: src/dispatcher.ts
import { EventEmitter } from 'events';
import { ExecutionPlan, ActionStep, RecordLite, ResearchBrief } from './spec/schemas.js';
import { LLMClient } from './types/llm.js';
import * as runStorage from './lib/run-storage.js';
import { logger } from './lib/logger.js';
import { searchPubMed } from './adapters/pubmed.js';
import { searchArxiv } from './adapters/arxiv.js';
import { searchMediaWiki } from './adapters/mediawiki.js';
import { searchLeaks } from './adapters/leaks.js';
import { queryWolfram } from './adapters/wolfram.js';
import { enrichWithOpenAlex } from './adapters/openalex.js';
import { screenRecords } from './agents/screening.js';
import { generateReport } from './agents/synthesis.js';

export const eventEmitter = new EventEmitter();

async function emitEvent(runId: string, type: string, data: any){
  const evt = { type, ts: Date.now(), ...data };
  await runStorage.appendEvent(runId, evt);
  eventEmitter.emit(runId, evt);
}

async function executeSearchStep(
  runId: string,
  step: ActionStep,
  brief: ResearchBrief,
  collected: RecordLite[]
): Promise<RecordLite[]> {
  logger.info('step start', { runId, stepId: step.id, action: step.action });
  await emitEvent(runId, 'step_start', {
    stepId: step.id,
    action: step.action,
    agent: step.agent
  });

  let results: RecordLite[] = [];
  switch (step.agent) {
    case 'pubmed_agent': {
      await emitEvent(runId, 'api_call', { tool: 'pubmed', params: step.params });
      results = await searchPubMed(step.params?.term || brief.objective, step.params?.retmax ?? 50);
      break;
    }
    case 'arxiv_agent': {
      await emitEvent(runId, 'api_call', { tool: 'arxiv', params: step.params });
      results = await searchArxiv(step.params?.query || brief.objective, step.params?.max_results ?? 50);
      break;
    }
    case 'mediawiki_agent': {
      await emitEvent(runId, 'api_call', { tool: 'mediawiki', params: step.params });
      results = [await searchMediaWiki(step.params?.term || brief.objective)];
      break;
    }
    case 'wolfram_agent': {
      await emitEvent(runId, 'api_call', { tool: 'wolfram', params: step.params });
      results = await queryWolfram(step.params?.input || brief.objective, step.params);
      break;
    }
    case 'leaks_agent': {
      await emitEvent(runId, 'api_call', { tool: 'leaks', params: step.params });
      results = await searchLeaks(step.params?.query || brief.objective, step.params?.limit ?? 20);
      break;
    }
    case 'openalex_agent': {
      await emitEvent(runId, 'api_call', { tool: 'openalex', params: step.params });
      results = await Promise.all(collected.map(r => enrichWithOpenAlex(r)));
      break;
    }
    default:
      logger.warn('Unknown search agent', { agent: step.agent });
  }

  const artifactPath = await runStorage.saveArtifact(
    runId,
    `${step.id}-results.json`,
    results
  );
  await emitEvent(runId, 'artifact', { stepId: step.id, path: artifactPath });
  await emitEvent(runId, 'stats', { stepId: step.id, count: results.length });
  logger.debug('search results', { stepId: step.id, count: results.length });
  return results;
}

export async function startExecution(
  runId: string,
  plan: ExecutionPlan,
  llm: LLMClient,
  brief?: ResearchBrief
) {
  await runStorage.create(runId);
  await emitEvent(runId, 'phase', { phase: 'start' });
  logger.info('execution started', { runId });
  const collected: RecordLite[] = [];
  try {
    for (const step of plan.steps) {
      if (step.action !== 'SEARCH') continue;
      try {
        const results = await executeSearchStep(runId, step, brief as any, collected);
        collected.push(...results);
      } catch (e: any) {
        await emitEvent(runId, 'error', { stepId: step.id, message: String(e) });
      }
    }

    const { kept, dropped_count } = await screenRecords(collected, brief as any, llm);
    const screenedPath = await runStorage.saveArtifact(
      runId,
      'screened-evidence.json',
      kept
    );
    await emitEvent(runId, 'artifact', { path: screenedPath });
    await emitEvent(runId, 'stats', { dropped: dropped_count });

    const final = await generateReport(runId, llm, kept);
    const reportPath = await runStorage.saveArtifact(
      runId,
      'final-report.json',
      final
    );
    await emitEvent(runId, 'artifact', { path: reportPath });
    await emitEvent(runId, 'complete', { ok: true });
    logger.info('execution complete', { runId });
  } catch (e: any) {
    await emitEvent(runId, 'error', { message: String(e) });
    await emitEvent(runId, 'complete', { ok: false });
  }
}


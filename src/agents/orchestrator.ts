// path: src/agents/orchestrator.ts
import { v4 as uuidv4 } from 'uuid';
import { ResearchBrief, ExecutionPlan, ActionStep } from '../spec/schemas.js';
import { LLMClient } from '../types/llm.js';
import { loadConfig } from '../config/user-config.js';
import { buildPubMedBoolean, buildArxivQuery, buildWolframInput, buildLeaksQuery } from '../lib/query-builders.js';
import {
  PUBMED_GUIDE,
  ARXIV_GUIDE,
  OPENALEX_GUIDE,
  MEDIAWIKI_GUIDE,
  LEAKS_GUIDE,
  WOLFRAM_GUIDE,
} from '../spec/tool-guides.js';


function needWolfram(domains: string[]): boolean {
  return domains.some(d => ['economics','numerics','time-series','geography'].includes(d));
}

export async function createExecutionPlan(brief: ResearchBrief, _llm: LLMClient): Promise<ExecutionPlan> {
  const cfg = await loadConfig();
  const domains = brief.scope.domains || [];
  const sources: { source_id: string; reason: string }[] = [];

  if (domains.includes('clinical') || domains.includes('medicine')) {
    sources.push({ source_id: 'pubmed', reason: 'clinical domain' });
  }
  if (domains.some(d => ['technology', 'physics', 'cs', 'ml'].includes(d))) {
    sources.push({ source_id: 'arxiv', reason: 'technical preprints' });
  }
  if (needWolfram(domains)) {
    sources.push({ source_id: 'wolfram', reason: 'numeric/time-series data' });
  }
  // Always include leaks if enabled
  if (cfg.enabled_tools.includes('leaks')) {
    sources.push({ source_id: 'leaks', reason: 'potential whistleblower documents' });
  }
  if (!sources.length) {
    sources.push({ source_id: 'arxiv', reason: 'general coverage' });
  }

  const steps: ActionStep[] = [];
  let idx = 1;
  if (sources.some(s => s.source_id === 'pubmed') && cfg.enabled_tools.includes('pubmed')) {
    const term = buildPubMedBoolean(brief);
    steps.push({
      id: `s${idx++}`,
      agent: 'pubmed_agent',
      action: 'SEARCH',
      params: { term, retmax: 100, timeframe: brief.scope?.timeframe ?? null },
      expects: 'RecordLite[]',
      specialist_instructions: PUBMED_GUIDE,
    });
  }

  if (sources.some(s => s.source_id === 'arxiv') && cfg.enabled_tools.includes('arxiv')) {
    const query = buildArxivQuery(brief);
    steps.push({
      id: `s${idx++}`,
      agent: 'arxiv_agent',
      action: 'SEARCH',
      params: { query, max_results: 100, timeframe: brief.scope?.timeframe ?? null },
      expects: 'RecordLite[]',
      specialist_instructions: ARXIV_GUIDE,
    });
  }

  if (cfg.enabled_tools.includes('openalex')) {
    steps.push({
      id: `s${idx++}`,
      agent: 'openalex_agent',
      action: 'SEARCH',
      params: { mode: 'enrich', fields: ['citation_count'] },
      expects: 'RecordLite[]',
      specialist_instructions: OPENALEX_GUIDE,
    });
  }

  if (sources.some(s => s.source_id === 'wolfram') && cfg.enabled_tools.includes('wolfram')) {
    const input = buildWolframInput(brief);
    steps.push({
      id: `s${idx++}`,
      agent: 'wolfram_agent',
      action: 'SEARCH',
      params: { input, maxchars: 2000, units: 'SI', timezone: 'UTC' },
      expects: 'RecordLite[]',
      specialist_instructions: WOLFRAM_GUIDE,
    });
  }

  if (sources.some(s => s.source_id === 'leaks') && cfg.enabled_tools.includes('leaks')) {
    const query = buildLeaksQuery(brief);
    steps.push({
      id: `s${idx++}`,
      agent: 'leaks_agent',
      action: 'SEARCH',
      params: { query },
      expects: 'RecordLite[]',
      specialist_instructions: LEAKS_GUIDE,
    });
  }

  if (cfg.enabled_tools.includes('mediawiki')) {
    const term = brief.objective || brief.key_questions[0] || '';
    steps.push({
      id: `s${idx++}`,
      agent: 'mediawiki_agent',
      action: 'SEARCH',
      params: { term },
      expects: 'RecordLite[]',
      specialist_instructions: MEDIAWIKI_GUIDE,
    });
  }
  steps.push({ id: `s${idx++}`, agent: 'screening_agent', action: 'SCREEN', params: {}, expects: 'evidence[]' });
  steps.push({ id: `s${idx++}`, agent: 'synthesis_agent', action: 'SYNTHESISE', params: {}, expects: 'report' });

  return {
    plan_id: uuidv4(),
    rationale_summary: process.env.ALLOW_DEBUG_TRACES === 'true' ? 'Plan generated using query builders and enabled tools.' : '',
    source_selection: sources,
    steps,
    evaluation: {
      success_criteria: ['≥3 high-quality records', 'final report generated', 'sources cover requested domains'],
      risks: ['insufficient data', 'API failures', 'tool mismatch']
    }
  };
}

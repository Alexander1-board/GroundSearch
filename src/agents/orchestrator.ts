// path: src/agents/orchestrator.ts
import { v4 as uuidv4 } from 'uuid';
import { ResearchBrief, ExecutionPlan } from '../spec/schemas.js';
import { CAPABILITIES } from '../config/capabilities.js';
import { LLMClient } from '../types/llm.js';

export async function createExecutionPlan(brief: ResearchBrief, _llm: LLMClient): Promise<ExecutionPlan> {
  const sources = [];
  const domains = brief.scope.domains || [];
  if (domains.includes('clinical')) sources.push({ source_id: 'pubmed', reason: 'biomed peer-reviewed' });
  if (domains.includes('technology') || domains.includes('physics') || domains.includes('cs') || domains.includes('ml')) {
    sources.push({ source_id: 'arxiv', reason: 'tech preprints' });
  }
  if (!sources.some(s=>s.source_id==='arxiv')) sources.push({ source_id: 'arxiv', reason: 'broad coverage' });
  if (!sources.some(s=>s.source_id==='pubmed')) sources.push({ source_id: 'pubmed', reason: 'baseline biomedical' });

  const steps = [
    { id: 's1', agent: 'pubmed_agent', action: 'SEARCH', params: { term: brief.objective, retmax: 50 }, expects: 'pubmed records' },
    { id: 's2', agent: 'arxiv_agent', action: 'SEARCH', params: { query: brief.objective, max_results: 50 }, expects: 'arxiv records' },
    { id: 's3', agent: 'screening_agent', action: 'SCREEN', params: {}, expects: 'evidence[]' },
    { id: 's4', agent: 'synthesis_agent', action: 'SYNTHESISE', params: {}, expects: 'report' },
  ] as any;

  return {
    plan_id: uuidv4(),
    rationale_summary: 'Search PubMed and arXiv, screen, then synthesise into a report.',
    source_selection: sources,
    steps,
    evaluation: { success_criteria: ['≥3 items', 'report generated'], risks: ['sparse data'] },
  };
}

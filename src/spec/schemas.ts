// path: src/spec/schemas.ts
import { z } from 'zod';

export const RecordLiteSchema = z.object({
  id: z.string(),
  source_id: z.string(),
  title: z.string(),
  url: z.string(),
  year: z.number().optional(),
  authors: z.array(z.string()).optional(),
  abstract: z.string().optional(),
});
export type RecordLite = z.infer<typeof RecordLiteSchema>;

export const EvidenceSchema = z.object({
  record: RecordLiteSchema,
  include: z.boolean().default(true),
  reason: z.string().optional(),
  quant_scores: z.record(z.number()).optional(),
  qual_notes: z.record(z.union([z.string(), z.number()])).optional(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const ComparisonTableSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});
export type ComparisonTable = z.infer<typeof ComparisonTableSchema>;

export const ActionStepSchema = z.object({
  id: z.string(),
  agent: z.string(),
  action: z.enum(['SEARCH','FETCH','PARSE','SCREEN','COMPARE','SYNTHESISE']),
  params: z.record(z.any()).default({}),
  expects: z.string().default(''),
  specialist_instructions: z.string().min(1).max(2000).optional(),
});
export type ActionStep = z.infer<typeof ActionStepSchema>;

export const ExecutionPlanSchema = z.object({
  plan_id: z.string(),
  rationale_summary: z.string(),
  source_selection: z.array(z.object({ source_id: z.string(), reason: z.string() })),
  steps: z.array(ActionStepSchema),
  evaluation: z.object({ success_criteria: z.array(z.string()), risks: z.array(z.string()) }),
});
export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;

export const ResearchBriefSchema = z.object({
  objective: z.string(),
  key_questions: z.array(z.string()).default([]),
  scope: z.object({
    timeframe: z.object({ from: z.string().optional(), to: z.string().optional() }).partial().default({}),
    geography: z.array(z.string()).optional(),
    comparators: z.array(z.string()).optional(),
    domains: z.array(z.string()).default([]),
    population: z.string().optional(),
    outcomes: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
  }),
  deliverable: z.object({ format: z.enum(['report','brief','bulletin','slide']), length: z.enum(['short','standard','long']), tone: z.enum(['neutral','adversarial','supportive']).optional() }),
  constraints: z.object({ latency_s: z.number().optional(), budget_usd: z.number().optional(), token_cap: z.number().optional() }).partial().optional(),
  citations_required: z.boolean().default(true),
  user_notes: z.string().optional(),
});
export type ResearchBrief = z.infer<typeof ResearchBriefSchema>;

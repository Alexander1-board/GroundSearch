// path: test/plan.spec.ts
import { describe, it, expect } from 'vitest';
import { createExecutionPlan } from '../src/agents/orchestrator.js';
import { ResearchBrief, ResearchBriefSchema, ExecutionPlanSchema } from '../src/spec/schemas.js';
import { MockLLMClient } from '../src/types/llm.js';

describe('Orchestrator Agent: Plan Generation', () => {
  it('should generate a valid ExecutionPlan for a clinical research brief', async () => {
    const brief: ResearchBrief = ResearchBriefSchema.parse({
      objective: "Evaluate new treatments for type 2 diabetes.",
      key_questions: ["What are the most effective new drugs?"],
      scope: {
        domains: ["clinical"],
        timeframe: { from: "2020-01-01" },
      },
      deliverable: { format: "report", length: "short" },
      citations_required: true,
    });

    const llm = new MockLLMClient('gemini', 'gemini-2.5-flash');
    const plan = await createExecutionPlan(brief, llm);

    // Validate the overall structure
    expect(() => ExecutionPlanSchema.parse(plan)).not.toThrow();

    // Assert specific planning heuristics
    expect(plan.source_selection.some(s => s.source_id === 'pubmed')).toBe(true);
    
    // Assert plan step structure
    expect(plan.steps.length).toBeGreaterThanOrEqual(3);
    expect(plan.steps.some(s => s.action === 'SEARCH')).toBe(true);
    expect(plan.steps.some(s => s.action === 'SCREEN')).toBe(true);
    expect(plan.steps[plan.steps.length - 1].action).toBe('SYNTHESISE');

    expect(plan.rationale_summary).toBeTypeOf('string');
    if(process.env.ALLOW_DEBUG_TRACES === 'true'){
      expect(plan.rationale_summary.length).toBeGreaterThan(10);
    }else{
      expect(plan.rationale_summary).toBe('');
    }

    expect(plan.evaluation.success_criteria.length).toBeGreaterThan(0);
    expect(plan.evaluation.risks.length).toBeGreaterThan(0);
  });
});

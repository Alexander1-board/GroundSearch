// path: src/agents/interview.ts
import { ResearchBrief, ResearchBriefSchema } from '../spec/schemas.js';
import { LLMClient } from '../types/llm.js';

export async function finaliseInterview(transcript: string[], current_outline: any, _llm: LLMClient): Promise<ResearchBrief> {
  // For demo: assume current_outline already contains required fields
  return ResearchBriefSchema.parse({
    objective: current_outline?.objective ?? 'General research question',
    key_questions: current_outline?.key_questions ?? [],
    scope: current_outline?.scope ?? { domains: [] },
    deliverable: current_outline?.deliverable ?? { format: 'report', length: 'short' },
    constraints: current_outline?.constraints,
    citations_required: true,
    user_notes: current_outline?.user_notes ?? '',
  });
}

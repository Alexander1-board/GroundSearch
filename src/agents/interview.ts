// path: src/agents/interview.ts
import { ResearchBrief, ResearchBriefSchema } from '../spec/schemas.js';
import { getMessages } from '../lib/chat-storage.js';

export async function finaliseInterview(sessionId: string): Promise<ResearchBrief> {
  const msgs = await getMessages(sessionId);
  const outlines = msgs.map(m => (m as any).outline).filter(Boolean);
  const merged = Object.assign({}, ...outlines);
  return ResearchBriefSchema.parse({
    objective: merged.objective ?? 'General research question',
    key_questions: merged.key_questions ?? [],
    scope: merged.scope ?? { domains: [] },
    deliverable: merged.deliverable ?? { format: 'report', length: 'short' },
    constraints: merged.constraints,
    citations_required: merged.citations_required ?? true,
    user_notes: merged.user_notes ?? ''
  });
}

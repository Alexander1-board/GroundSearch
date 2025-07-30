// path: src/agents/qual.ts
import { RecordLite } from '../spec/schemas.js';
import { LLMClient } from '../types/llm.js';
import { z } from 'zod';

const QualSchema = z.object({
  rigor: z.number().min(0).max(100),
  bias: z.number().min(0).max(100),
  relevance: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  justification: z.string(),
});

export async function assessQuality(record: RecordLite, llm: LLMClient) {
  const prompt = `Rate the following excerpt on rigor, bias, relevance and clarity from 0 to 100. Provide one sentence justification. Do not mention the source.\nTitle: ${record.title}\nAbstract: ${record.abstract ?? ''}`;
  const result = await llm.generateJSON(prompt, QualSchema, {
    mockData: {
      rigor: 50,
      bias: 50,
      relevance: 50,
      clarity: 50,
      justification: 'demo',
    },
  });
  return result as Record<string, string | number>;
}

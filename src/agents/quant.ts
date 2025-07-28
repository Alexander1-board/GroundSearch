// path: src/agents/quant.ts
import { RecordLite } from '../spec/schemas.js';

export function scoreRecord(record: RecordLite): Record<string, number> {
  const currentYear = new Date().getFullYear();
  const recency = record.year ? 1 / (currentYear - record.year + 1) : 0;

  let sample_size: number | undefined;
  const m = record.abstract?.match(/(?:N|n)\s*=\s*(\d{2,6})/);
  if (m) sample_size = Number(m[1]);

  const citation_count = (record as any).citation_count as number | undefined;

  const out: Record<string, number> = { recency };
  if (sample_size !== undefined) out.sample_size = sample_size;
  if (citation_count !== undefined) out.citation_count = citation_count;
  return out;
}

// path: src/agents/quant.ts
import { RecordLite } from '../spec/schemas.js';

function clamp(v: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

// Deterministic quantitative score based on basic heuristics
export function scoreRecord(
  record: RecordLite,
  comparators: string[] = []
): Record<string, number> {
  const currentYear = new Date().getFullYear();
  const year = record.year ?? currentYear;
  const recency = clamp(1 - clamp((currentYear - year) / 20));

  let sampleSize: number | undefined;
  const m = record.abstract?.match(/(?:N|n)\s*=\s*(\d{2,6})/);
  if (m) sampleSize = Number(m[1]);
  const sampleLog = sampleSize ? Math.log10(sampleSize) : 0;

  const citationCount = (record as any).citation_count as number | undefined;
  const citationLog = citationCount ? Math.log10(citationCount + 1) : 0;

  const text = `${record.title} ${record.abstract ?? ''}`.toLowerCase();
  const comparatorPresent = comparators.length
    ? Number(comparators.some(c => text.includes(c.toLowerCase())))
    : 0;

  const score =
    (recency * 0.4 + clamp(sampleLog / 4) * 0.3 + clamp(citationLog / 4) * 0.2 + comparatorPresent * 0.1) *
    100;

  return {
    quant_score: Math.round(score),
    recency,
    sample_log: sampleLog,
    citation_log: citationLog,
    comparator: comparatorPresent,
  } as Record<string, number>;
}

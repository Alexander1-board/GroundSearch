// path: src/agents/screening.ts
import { Evidence, RecordLite, ResearchBrief } from '../spec/schemas.js';
import { scoreRecord } from './quant.js';
import { assessQuality } from './qual.js';
import { LLMClient } from '../types/llm.js';

export async function screenRecords(
  records: RecordLite[],
  brief: ResearchBrief,
  llm: LLMClient
): Promise<{ kept: Evidence[]; dropped_count: number }> {
  const seen = new Set<string>();
  const kept: Evidence[] = [];
  let dropped = 0;

  for (const r of records) {
    const key = (r.url || r.id || r.title).toLowerCase();
    if (seen.has(key)) {
      dropped++;
      continue;
    }
    seen.add(key);

    const tf = brief.scope?.timeframe || {};
    if (tf.from && r.year && r.year < parseInt(tf.from)) {
      dropped++;
      continue;
    }
    if (tf.to && r.year && r.year > parseInt(tf.to)) {
      dropped++;
      continue;
    }

    const text = `${r.title} ${(r.abstract || '')}`.toLowerCase();
    // Domain and comparator filters are heuristically applied only when strings are found
    if (brief.scope?.domains?.length) {
      const ok = brief.scope.domains.some(d => text.includes(d.toLowerCase()));
      if (!ok) {
        // do not drop, just note
      }
    }
    if (brief.scope?.comparators?.length) {
      const ok = brief.scope.comparators.some(c => text.includes(c.toLowerCase()));
      if (!ok) {
        // comparator not mentioned; still keep
      }
    }

    const quant_scores = scoreRecord(r, brief.scope?.comparators ?? []);
    const qual_notes = await assessQuality(r, llm);
    kept.push({
      record: r,
      include: true,
      reason: 'kept',
      quant_scores,
      qual_notes,
    });
  }

  return { kept, dropped_count: dropped };
}

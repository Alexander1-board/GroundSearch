// path: src/agents/screening.ts
import { Evidence, RecordLite } from '../spec/schemas.js';

export async function screenRecords(records: RecordLite[]): Promise<Evidence[]> {
  // Minimal screening: include all records with titles present
  return records.filter(r => !!r.title).map(r => ({
    record: r,
    include: true,
    reason: 'auto-include for demo',
    quant_scores: { recency: r.year ? 1/(new Date().getFullYear() - r.year + 1) : 0.5 }
  }));
}

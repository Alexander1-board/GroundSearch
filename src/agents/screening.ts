// path: src/agents/screening.ts
import { Evidence, RecordLite } from '../spec/schemas.js';
import { scoreRecord } from './quant.js';
import { assessBias } from './qual.js';

export async function screenRecords(records: RecordLite[]): Promise<Evidence[]> {
  // Minimal screening: include all records with titles present
  return records.filter(r => !!r.title).map(r => {
    const quant = scoreRecord(r);
    const qual = assessBias(r);
    return {
      record: r,
      include: true,
      reason: 'auto-include for demo',
      quant_scores: quant,
      qual_notes: qual
    } as Evidence;
  });
}

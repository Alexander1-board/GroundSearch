// path: src/agents/qual.ts
import { RecordLite } from '../spec/schemas.js';

export function assessBias(record: RecordLite): Record<string, string> {
  const bias = record.authors && record.authors.length > 3 ? '2' : '3';
  const reason = 'heuristic author-count bias estimate';
  return { bias, reason };
}

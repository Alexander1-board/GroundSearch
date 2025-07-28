// path: src/agents/synthesis.ts
import { Evidence, ComparisonTable } from '../spec/schemas.js';

export async function generateReport(runId: string, _llm: any, evidence: Evidence[]): Promise<{ markdown: string; comparisonTable: ComparisonTable }>{ 
  const headers = ['Title','Source','Year'];
  const rows = evidence.slice(0,10).map(e => [e.record.title, e.record.source_id, String(e.record.year ?? '')]);
  const comparisonTable: ComparisonTable = { headers, rows };
  const mdLines = [
    '# Synthesis Report',
    '',
    '## Findings',
    ...rows.map(r=>`- **${r[0]}** (${r[1]} ${r[2]})`),
    '',
    '## Implications',
    '- This is a minimal demo synthesis.'
  ];
  return { markdown: mdLines.join('\n'), comparisonTable };
}

// path: src/agents/synthesis.ts
import { Evidence, ComparisonTable } from '../spec/schemas.js';

export async function generateReport(runId: string, _llm: any, evidence: Evidence[]): Promise<{ markdown: string; comparisonTable: ComparisonTable }>{
  const headers = ['Title','Source','Year','Quant Score','Bias'];
  const rows = evidence.slice(0,10).map(e => [
    e.record.title,
    e.record.source_id,
    String(e.record.year ?? ''),
    String(e.quant_scores?.recency?.toFixed(2) ?? ''),
    e.qual_notes?.reason || ''
  ]);
  const comparisonTable: ComparisonTable = { headers, rows };
  const mdLines = [
    '# Synthesis Report',
    '',
    '## Findings',
    ...rows.map(r=>`- **${r[0]}** (${r[1]} ${r[2]}) scored ${r[3]} with bias note: ${r[4]}.`),
    '',
    '## Implications',
    '- This report summarises results across PubMed and arXiv.',
    '- Evidence indicates a range of perspectives.',
    '- Further research is recommended.'
  ];
  return { markdown: mdLines.join('\n'), comparisonTable };
}

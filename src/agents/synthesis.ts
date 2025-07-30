// path: src/agents/synthesis.ts
import { Evidence, ComparisonTable } from '../spec/schemas.js';

export async function generateReport(
  runId: string,
  _llm: any,
  evidence: Evidence[]
): Promise<{ markdown: string; comparisonTable: ComparisonTable; rationale_summary?: string }> {
  const headers = [
    'Source',
    'Year',
    'Sample Size',
    'Key Outcome',
    'Quant Score',
    'Bias Summary',
    'Citation (URL)',
  ];

  const rows = evidence.map((e, i) => {
    const sampleMatch = e.record.abstract?.match(/(?:N|n)\s*=\s*(\d{2,6})/);
    const sample = sampleMatch ? sampleMatch[1] : '';
    const outcome = (e.record.abstract || '').split(/\.|\n/)[0] || '';
    const citation = `[${i + 1}](${e.record.url})`;
    return [
      e.record.source_id,
      String(e.record.year ?? ''),
      sample,
      outcome.trim(),
      String(e.quant_scores?.quant_score ?? ''),
      String(e.qual_notes?.justification ?? ''),
      citation,
    ];
  });

  const comparisonTable: ComparisonTable = { headers, rows };

  const sources = Array.from(new Set(evidence.map(e => e.record.source_id))).join(', ');

  const summary = `This report summarises ${evidence.length} records from ${sources}.`;

  const citationList = evidence.map((e, i) => `${i + 1}. [${e.record.title}](${e.record.url})`);

  const mdLines = [
    '# Research Report',
    '',
    '## Executive Summary',
    summary,
    '',
    '## Limitations',
    '- This synthesis used available records only; some sources may be incomplete.',
    '',
    '## Citations',
    ...citationList,
    '',
    `Provenance: runs/${runId}/artifacts/screened-evidence.json`,
  ];

  const rationale_summary = process.env.ALLOW_DEBUG_TRACES === 'true'
    ? 'Synthesis generated from screened evidence.'
    : undefined;

  return { markdown: mdLines.join('\n'), comparisonTable, rationale_summary };
}

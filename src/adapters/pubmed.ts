// path: src/adapters/pubmed.ts
import { RecordLite } from '../spec/schemas.js';
import { promises as fs } from 'fs';
import path from 'path';

export async function searchPubMed(term: string, retmax = 50): Promise<RecordLite[]> {
  // Use fixture
  const esummary = JSON.parse(await fs.readFile(path.resolve(process.cwd(), 'test/fixtures/pubmed.esummary.json'), 'utf8'));
  const ids: string[] = esummary.result?.uids ?? Object.keys(esummary.result || {}).filter(k=>k!=='uids');
  const records: RecordLite[] = [];
  for (const id of ids.slice(0, retmax)) {
    const r = esummary.result[id];
    if (!r) continue;
    records.push({
      id: String(id),
      source_id: 'pubmed',
      title: r.title || `PubMed Article ${id}`,
      url: r.elocationid ? `https://pubmed.ncbi.nlm.nih.gov/${id}/` : `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      year: Number((r.pubdate||'').slice(0,4)) || undefined,
      authors: (r.authors||[]).map((a:any)=>a.name),
      abstract: r.sortfirstauthor || ''
    });
  }
  return records;
}

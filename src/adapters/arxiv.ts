// path: src/adapters/arxiv.ts
import { RecordLite } from '../spec/schemas.js';
import { promises as fs } from 'fs';
import path from 'path';

export async function searchArxiv(query: string, max_results = 50): Promise<RecordLite[]> {
  const xml = await fs.readFile(path.resolve(process.cwd(), 'test/fixtures/arxiv.atom'), 'utf8');
  // naive parse to get title and id links
  const entries = xml.split('<entry>').slice(1);
  const out: RecordLite[] = [];
  for (const e of entries.slice(0, max_results)) {
    const id = (e.match(/<id>(.*?)<\/id>/s) || [])[1] || Math.random().toString(36).slice(2);
    const title = ((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').replace(/\s+/g,' ').trim();
    const updated = (e.match(/<updated>(.*?)<\/updated>/) || [])[1];
    out.push({
      id,
      source_id: 'arxiv',
      title: title || 'arXiv entry',
      url: id,
      year: updated ? Number(updated.slice(0,4)) : undefined,
    });
  }
  return out;
}

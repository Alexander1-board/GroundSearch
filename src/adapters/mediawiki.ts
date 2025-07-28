import { RecordLite } from '../spec/schemas.js';
import { promises as fs } from 'fs';
import path from 'path';

async function parseFixture(): Promise<RecordLite[]> {
  const txt = await fs.readFile(path.resolve('test/fixtures/mediawiki.json'), 'utf8');
  const data = JSON.parse(txt);
  return (data.query?.search || []).map((item: any) => ({
    id: String(item.pageid),
    source_id: 'mediawiki',
    title: item.title,
    url: `https://en.wikipedia.org/?curid=${item.pageid}`,
    year: undefined,
    authors: [],
    abstract: item.snippet
  }));
}

export async function searchMediaWiki(term: string, limit = 5): Promise<RecordLite[]> {
  const recs = await parseFixture();
  return recs.slice(0, limit);
}

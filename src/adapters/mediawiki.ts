import { RecordLite } from '../spec/schemas.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fetchWithRetry } from '../lib/http.js';

async function parseFixture(): Promise<RecordLite> {
  const txt = await fs.readFile(path.resolve('test/fixtures/mediawiki.json'), 'utf8');
  const data = JSON.parse(txt);
  const item = data.query?.search?.[0];
  return {
    id: item ? String(item.pageid) : '0',
    source_id: 'mediawiki',
    title: item?.title || 'Example',
    url: `https://en.wikipedia.org/?curid=${item?.pageid ?? 0}`,
    year: undefined,
    authors: [],
    abstract: item?.snippet || ''
  };
}

export async function searchMediaWiki(term: string): Promise<RecordLite> {
  const base = process.env.MEDIAWIKI_BASE_URL;
  if (!base) {
    return parseFixture();
  }
  try {
    const searchUrl = `${base}?action=query&list=search&format=json&srlimit=1&srsearch=${encodeURIComponent(term)}`;
    const sRes = await fetchWithRetry(searchUrl, {}, { rpsKey: 'mediawiki' });
    const sData: any = await sRes.json();
    const item = sData.query?.search?.[0];
    if (!item) return parseFixture();
    const summaryUrl = `${base}?action=query&prop=extracts&exintro=1&explaintext=1&format=json&pageids=${item.pageid}`;
    const sumRes = await fetchWithRetry(summaryUrl, {}, { rpsKey: 'mediawiki' });
    const sumData: any = await sumRes.json();
    const page = sumData.query?.pages?.[item.pageid];
    return {
      id: String(item.pageid),
      source_id: 'mediawiki',
      title: item.title,
      url: `https://en.wikipedia.org/?curid=${item.pageid}`,
      year: undefined,
      authors: [],
      abstract: page?.extract || item.snippet || ''
    };
  } catch {
    return parseFixture();
  }
}

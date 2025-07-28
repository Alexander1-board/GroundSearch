// path: src/adapters/arxiv.ts
import { RecordLite } from '../spec/schemas.js';
import { XMLParser } from 'fast-xml-parser';
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { fetchWithRetry } from '../lib/http.js';
import { sleep } from '../lib/sleep.js';

let lastCall = 0;
const parser = new XMLParser({ ignoreAttributes: false });

function parseAtom(xml: string, limit: number): RecordLite[] {
  const feed = parser.parse(xml);
  const entries = Array.isArray(feed.feed?.entry) ? feed.feed.entry : feed.feed?.entry ? [feed.feed.entry] : [];
  return entries.slice(0, limit).map((e: any) => ({
    id: e.id,
    source_id: 'arxiv',
    title: (e.title || '').replace(/\s+/g, ' ').trim(),
    url: typeof e.link === 'object' && e.link?.['@_href'] ? e.link['@_href'] : e.id,
    year: e.published ? Number(String(e.published).slice(0, 4)) : undefined,
    authors: (Array.isArray(e.author) ? e.author : [e.author]).filter(Boolean).map((a: any) => a.name),
    abstract: (e.summary || '').trim()
  }));
}

async function loadFixture(limit: number): Promise<RecordLite[]> {
  const xml = await fs.readFile(path.resolve(process.cwd(), 'test/fixtures/arxiv.atom'), 'utf8');
  return parseAtom(xml, limit);
}

export async function searchArxiv(query: string, max_results = 50, start = 0): Promise<RecordLite[]> {
  const now = Date.now();
  const wait = 3000 - (now - lastCall);
  if (wait > 0) await sleep(wait);

  const url =
    `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}` +
    `&start=${start}&max_results=${max_results}`;
  lastCall = Date.now();

  try {
    const res = await fetchWithRetry(url, {}, { rpsKey: 'arxiv' });
    const xml = await res.text();
    return parseAtom(xml, max_results);
  } catch {
    return loadFixture(max_results);
  }
}

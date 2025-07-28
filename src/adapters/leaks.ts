import { promises as fs } from 'fs';
import path from 'path';
import { fetchWithRetry } from '../lib/http.js';
import { RecordLite } from '../spec/schemas.js';

async function loadFixture(limit:number): Promise<RecordLite[]> {
  const txt = await fs.readFile(path.resolve('test/fixtures/leaks.json'),'utf8');
  const data = JSON.parse(txt);
  return (data.results || []).slice(0, limit).map((r:any)=>({
    id: r.id,
    source_id:'leaks',
    title: r.title,
    url: r.url,
    year: r.published ? Number(String(r.published).slice(0,4)) : undefined,
    authors: [],
    abstract: r.snippet
  }));
}

export async function searchLeaks(query:string, limit=20): Promise<RecordLite[]> {
  const base = process.env.LEAKS_BASE_URL;
  if(!base){
    return loadFixture(limit);
  }
  try {
    const url = `${base.replace(/\/$/,'')}/search/?q=${encodeURIComponent(query)}&per_page=${limit}`;
    const res = await fetchWithRetry(url, {}, { rpsKey:'leaks' });
    const data: any = await res.json();
    return (data.results || []).map((r:any)=>({
      id: String(r.id),
      source_id:'leaks',
      title: r.title,
      url: r.url,
      year: r.published ? Number(String(r.published).slice(0,4)) : undefined,
      authors: [],
      abstract: r.snippet
    })).slice(0, limit);
  } catch {
    return loadFixture(limit);
  }
}

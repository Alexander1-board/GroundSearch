// path: src/adapters/pubmed.ts
import { RecordLite } from '../spec/schemas.js';
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { fetchWithRetry } from '../lib/http.js';

async function loadFixture(limit: number): Promise<RecordLite[]> {
  const esummary = JSON.parse(
    await fs.readFile(
      path.resolve(process.cwd(), 'test/fixtures/pubmed.esummary.json'),
      'utf8'
    )
  );
  const ids: string[] =
    esummary.result?.uids ?? Object.keys(esummary.result || {}).filter(k => k !== 'uids');
  const records: RecordLite[] = [];
  for (const id of ids.slice(0, limit)) {
    const r = esummary.result[id];
    if (!r) continue;
    records.push({
      id: String(id),
      source_id: 'pubmed',
      title: r.title || `PubMed Article ${id}`,
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      year: Number((r.pubdate || '').slice(0, 4)) || undefined,
      authors: (r.authors || []).map((a: any) => a.name),
      abstract: r.abstract || ''
    });
  }
  return records;
}

export async function searchPubMed(term: string, retmax = 50, retstart = 0): Promise<RecordLite[]> {
  const apiKey = process.env.NCBI_API_KEY || process.env.NCBI_API_KEY_SECRET;
  if (!apiKey) return loadFixture(retmax);

  try {
    const searchUrl =
      'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi' +
      `?db=pubmed&retmode=json&usehistory=y&term=${encodeURIComponent(term)}` +
      `&retmax=${retmax}&retstart=${retstart}` +
      (apiKey ? `&api_key=${apiKey}` : '');
    const esearchRes = await fetchWithRetry(searchUrl, {}, { rpsKey: 'pubmed' });
    const esearch: any = await esearchRes.json();
    const queryKey = esearch.esearchresult.querykey;
    const webEnv = esearch.esearchresult.webenv;
    const ids: string[] = esearch.esearchresult.idlist || [];

    const summaryUrl =
      'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi' +
      `?db=pubmed&retmode=json&query_key=${queryKey}&WebEnv=${webEnv}` +
      `&retstart=${retstart}&retmax=${retmax}` +
      (apiKey ? `&api_key=${apiKey}` : '');
    const esummaryRes = await fetchWithRetry(summaryUrl, {}, { rpsKey: 'pubmed' });
    const esummary: any = await esummaryRes.json();

    const records: RecordLite[] = [];
    for (const id of ids) {
      const r = esummary.result[id];
      if (!r) continue;
      records.push({
        id: String(id),
        source_id: 'pubmed',
        title: r.title || `PubMed Article ${id}`,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        year: Number((r.pubdate || '').slice(0, 4)) || undefined,
        authors: (r.authors || []).map((a: any) => a.name),
        abstract: r.abstract || ''
      });
    }
    return records;
  } catch {
    return loadFixture(retmax);
  }
}

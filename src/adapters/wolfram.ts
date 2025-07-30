// path: src/adapters/wolfram.ts
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { fetchWithRetry } from '../lib/http.js';
import { RecordLite } from '../spec/schemas.js';

interface WolframPod { title: string; plaintext?: string; }

function buildInput(query: string, opts: { region?: string; dates?: { from?: string; to?: string }; units?: string; perCapita?: boolean } = {}): string {
  let input = query;
  if (opts.region) input += ` in ${opts.region}`;
  if (opts.dates?.from || opts.dates?.to) {
    const from = opts.dates?.from ?? '';
    const to = opts.dates?.to ?? '';
    input += ` from ${from} to ${to}`.trim();
  }
  if (opts.units) input += ` in ${opts.units}`;
  if (opts.perCapita) input += ' per capita';
  return input.trim();
}

async function loadFixture(): Promise<RecordLite[]> {
  const data = JSON.parse(
    await fs.readFile(path.resolve(process.cwd(), 'test/fixtures/wolfram.json'), 'utf8')
  );
  const pods = (data.queryresult?.pods || []) as any[];
  return pods.map((p: any, idx: number) => ({
    id: String(idx),
    source_id: 'wolfram',
    title: p.title,
    url: `${data.queryresult?.host || 'https://www.wolframalpha.com'}/input/?i=${encodeURIComponent(p.subpods?.[0]?.plaintext || '')}`,
    year: new Date().getFullYear(),
    authors: [],
    abstract: p.subpods?.[0]?.plaintext || ''
  }));
}

export async function queryWolfram(question: string, opts: any = {}): Promise<RecordLite[]> {
  const appid = process.env.WOLFRAM_APPID || process.env.WOLFRAM_APPID_SECRET;
  if (!appid) return loadFixture();

  const input = buildInput(question, opts);
  const params = new URLSearchParams({ input, ...opts, appid });
  const url = `https://www.wolframalpha.com/api/v1/llm-api?${params.toString()}`;

  try {
    const res = await fetchWithRetry(url, { headers: { Authorization: `Bearer ${appid}` } }, { rpsKey: 'wolfram' });
    if (res.status === 403) return loadFixture();
    const data: any = await res.json();
    const pods = data.pods || data.queryresult?.pods || [];
    return pods.map((p: any, idx: number) => ({
      id: String(idx),
      source_id: 'wolfram',
      title: p.title,
      url: data.result_url || data.queryresult?.host || 'https://www.wolframalpha.com',
      year: new Date().getFullYear(),
      authors: [],
      abstract: p.plaintext || p.subpods?.[0]?.plaintext || ''
    }));
  } catch {
    return loadFixture();
  }
}

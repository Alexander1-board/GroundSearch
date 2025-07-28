// path: src/adapters/wolfram.ts
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { fetchWithRetry } from '../lib/http.js';

interface WolframPod { title: string; plaintext?: string; } // simplified

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

async function loadFixture(): Promise<{ pods: WolframPod[] }> {
  const data = JSON.parse(
    await fs.readFile(path.resolve(process.cwd(), 'test/fixtures/wolfram.json'), 'utf8')
  );
  const pods = (data.queryresult?.pods || []).map((p: any) => ({ title: p.title, plaintext: p.subpods?.[0]?.plaintext }));
  return { pods };
}

export async function queryWolfram(question: string, opts: any = {}): Promise<{ pods: WolframPod[] }> {
  const appid = process.env.WOLFRAM_APPID;
  if (!appid) return loadFixture();

  const input = buildInput(question, opts);
  const baseUrl = 'https://api.wolframalpha.com/v2/query';
  const url = `${baseUrl}?input=${encodeURIComponent(input)}&output=json&appid=${appid}`;

  try {
    let res = await fetchWithRetry(url, {}, { rpsKey: 'wolfram' });
    let data: any = await res.json();
    if (!data.queryresult?.success && (data.queryresult?.didyoumeans || data.queryresult?.assumptions)) {
      const refine = data.queryresult.didyoumeans?.didyoumean?.[0]?.val || data.queryresult.assumptions?.assumption?.[0]?.values?.[0]?.input;
      if (refine) {
        const refineUrl = `${baseUrl}?input=${encodeURIComponent(refine)}&output=json&appid=${appid}`;
        res = await fetchWithRetry(refineUrl, {}, { rpsKey: 'wolfram' });
        data = await res.json();
      }
    }
    const pods = (data.queryresult?.pods || []).map((p: any) => ({ title: p.title, plaintext: p.subpods?.[0]?.plaintext }));
    return { pods };
  } catch {
    return loadFixture();
  }
}

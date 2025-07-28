// path: test/adapters.live.spec.ts
import { describe, it, expect } from 'vitest';
import { searchPubMed } from '../src/adapters/pubmed.js';
import { searchArxiv } from '../src/adapters/arxiv.js';
import { queryWolfram } from '../src/adapters/wolfram.js';

const hasKeys = !!process.env.NCBI_API_KEY && !!process.env.WOLFRAM_APPID;

(hasKeys ? describe : describe.skip)('Live adapter calls', () => {
  it('PubMed live search', async () => {
    const recs = await searchPubMed('cancer', 2);
    expect(recs.length).toBeGreaterThan(0);
  });

  it('arXiv live search', async () => {
    const recs = await searchArxiv('quantum computing', 2);
    expect(recs.length).toBeGreaterThan(0);
  });

  it('Wolfram live query', async () => {
    const res = await queryWolfram('population of germany');
    expect(res.pods.length).toBeGreaterThan(0);
  });
});

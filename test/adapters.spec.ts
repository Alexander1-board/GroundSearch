// path: test/adapters.spec.ts
import { describe, it, expect } from 'vitest';
import { searchPubMed } from '../src/adapters/pubmed.js';
import { searchArxiv } from '../src/adapters/arxiv.js';
import { queryWolfram } from '../src/adapters/wolfram.js';
import { searchMediaWiki } from '../src/adapters/mediawiki.js';

describe('Adapters with fixtures', () => {
  it('parses PubMed fixtures', async () => {
    const records = await searchPubMed('diabetes', 3);
    expect(records.length).toBe(3);
    expect(records[0]).toHaveProperty('title');
    expect(records[0].source_id).toBe('pubmed');
  });

  it('parses arXiv fixtures', async () => {
    const records = await searchArxiv('quantum', 2);
    expect(records.length).toBe(2);
    expect(records[0]).toHaveProperty('title');
    expect(records[0].source_id).toBe('arxiv');
  });

  it('parses Wolfram fixtures', async () => {
    const result = await queryWolfram('population of France');
    expect(Array.isArray(result.pods)).toBe(true);
    expect(result.pods.length).toBeGreaterThan(0);
  });

  it('parses MediaWiki fixtures', async () => {
    const records = await searchMediaWiki('example', 2);
    expect(records.length).toBe(2);
    expect(records[0].source_id).toBe('mediawiki');
  });
});

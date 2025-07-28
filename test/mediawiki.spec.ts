import { describe, it, expect } from 'vitest';
import { searchMediaWiki } from '../src/adapters/mediawiki.js';

describe('MediaWiki adapter', () => {
  it('loads fixture records', async () => {
    const recs = await searchMediaWiki('test', 2);
    expect(recs.length).toBe(2);
    expect(recs[0].source_id).toBe('mediawiki');
  });
});

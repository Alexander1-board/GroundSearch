import { describe, it, expect } from 'vitest';
import { searchMediaWiki } from '../src/adapters/mediawiki.js';

describe('MediaWiki adapter', () => {
  it('loads fixture record', async () => {
    const rec = await searchMediaWiki('test');
    expect(rec.source_id).toBe('mediawiki');
    expect(rec.title).toBeDefined();
  });
});

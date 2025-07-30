import { describe, it, expect } from 'vitest';
import { searchLeaks } from '../src/adapters/leaks.js';

describe('Leaks adapter', () => {
  it('loads fixture records', async () => {
    const recs = await searchLeaks('test', 2);
    expect(recs.length).toBe(2);
    expect(recs[0].source_id).toBe('leaks');
  });
});

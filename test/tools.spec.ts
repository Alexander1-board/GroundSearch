import { describe, it, expect } from 'vitest';
import { getToolSpecs } from '../src/tools/registry.js';

describe('Tool registry', () => {
  it('includes leaks tool', () => {
    const specs = getToolSpecs();
    const ids = specs.map(s=>s.id);
    expect(ids).toContain('leaks');
  });
});

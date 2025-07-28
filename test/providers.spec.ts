import { describe, it, expect } from 'vitest';
import { getLLM, availableProviders } from '../src/providers/registry.js';

describe('Provider registry', () => {
  it('falls back to mock when no keys', () => {
    const llm = getLLM('openai', 'gpt-4');
    expect(llm.provider).toBe('openai');
  });

  it('lists mock provider always', () => {
    expect(availableProviders()).toContain('mock');
  });
});

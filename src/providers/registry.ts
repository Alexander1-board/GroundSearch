export type ProviderId = 'gemini' | 'openai' | 'anthropic' | 'grok' | 'ollama' | 'mock';

import { LLMClient, MockLLMClient } from '../types/llm.js';
import { getGeminiClient } from './gemini.js';
import { getOpenAIClient } from './openai.js';
import { getAnthropicClient } from './anthropic.js';
import { getGrokClient } from './grok.js';
import { getOllamaClient } from './ollama.js';

export function getLLM(provider: ProviderId, model: string): LLMClient {
  switch (provider) {
    case 'gemini':
      return getGeminiClient(model);
    case 'openai':
      return getOpenAIClient(model);
    case 'anthropic':
      return getAnthropicClient(model);
    case 'grok':
      return getGrokClient(model);
    case 'ollama':
      return getOllamaClient(model);
    default:
      return new MockLLMClient(provider, model);
  }
}

export function availableProviders(): ProviderId[] {
  const list: ProviderId[] = ['mock'];
  const has = (k: string) => process.env[k] || process.env[`${k}_SECRET`];
  if (has('OPENAI_API_KEY')) list.push('openai');
  if (has('ANTHROPIC_API_KEY')) list.push('anthropic');
  if (has('GEMINI_API_KEY')) list.push('gemini');
  if (has('GROK_API_KEY')) list.push('grok');
  if (process.env.OLLAMA_BASE_URL) list.push('ollama');
  return list;
}

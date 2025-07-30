import { LLMClient, MockLLMClient } from '../types/llm.js';
import { fetchWithRetry } from '../lib/http.js';

export function getAnthropicClient(model: string): LLMClient {
  const key = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY_SECRET;
  if (!key) return new MockLLMClient('anthropic', model);
  return {
    provider: 'anthropic',
    model,
    async generateJSON(prompt, schema) {
      const res = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key || '',
          'anthropic-version': '2023-06-01'
        } as any,
        body: JSON.stringify({ model, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] })
      }, { rpsKey: 'anthropic' });
      const data: any = await res.json();
      const text = data.content?.[0]?.text || '{}';
      return schema.parse(JSON.parse(text));
    }
  };
}

import { LLMClient, MockLLMClient } from '../types/llm.js';
import { fetchWithRetry } from '../lib/http.js';

export function getGrokClient(model: string): LLMClient {
  const key = process.env.GROK_API_KEY || process.env.GROK_API_KEY_SECRET;
  if (!key) return new MockLLMClient('grok', model);
  return {
    provider: 'grok',
    model,
    async generateJSON(prompt, schema) {
      const res = await fetchWithRetry('https://api.grok.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] })
      }, { rpsKey: 'grok' });
      const data: any = await res.json();
      const text = data.choices?.[0]?.message?.content || '{}';
      return schema.parse(JSON.parse(text));
    }
  };
}

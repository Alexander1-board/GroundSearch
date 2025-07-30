import { LLMClient, MockLLMClient } from '../types/llm.js';
import { fetchWithRetry } from '../lib/http.js';

export function getOpenAIClient(model: string): LLMClient {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_SECRET;
  if (!key) return new MockLLMClient('openai', model);
  return {
    provider: 'openai',
    model,
    async generateJSON(prompt, schema, vars) {
      const res = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0 })
      }, { rpsKey: 'openai' });
      const data: any = await res.json();
      const text = data.choices?.[0]?.message?.content || '{}';
      return schema.parse(JSON.parse(text));
    }
  };
}

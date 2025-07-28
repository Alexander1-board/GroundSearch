import { LLMClient, MockLLMClient } from '../types/llm.js';
import { fetchWithRetry } from '../lib/http.js';
export function getGeminiClient(model: string): LLMClient {
  if (!process.env.GEMINI_API_KEY) return new MockLLMClient('gemini', model);
  return {
    provider: 'gemini',
    model,
    async generateJSON(prompt, schema, vars) {
      const res = await fetchWithRetry('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + process.env.GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }, { rpsKey: 'gemini' });
      const data: any = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return schema.parse(JSON.parse(text));
    }
  };
}

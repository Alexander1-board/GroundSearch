import { LLMClient, MockLLMClient } from '../types/llm.js';
import { fetchWithRetry } from '../lib/http.js';
export function getOllamaClient(model: string): LLMClient {
  if (!process.env.OLLAMA_BASE_URL) return new MockLLMClient('ollama', model);
  return {
    provider: 'ollama',
    model,
    async generateJSON(prompt, schema) {
      const res = await fetchWithRetry(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false })
      }, { rpsKey: 'ollama' });
      const data: any = await res.json();
      const text = data.response || '{}';
      return schema.parse(JSON.parse(text));
    }
  };
}

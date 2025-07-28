// path: src/types/llm.ts
import { ZodType } from 'zod';

export interface LLMClient {
  generateJSON<T>(prompt: string, schema: ZodType<T>, vars?: Record<string, any>): Promise<T>;
}

export class MockLLMClient implements LLMClient {
  constructor(private provider: string, private model: string){}
  async generateJSON<T>(_prompt: string, schema: ZodType<T>, vars?: Record<string, any>): Promise<T>{
    if (vars && vars.mockData) return schema.parse(vars.mockData);
    // Fallback: try to parse an empty object to the schema by creating minimal required fields
    try { return schema.parse({}); } catch { throw new Error('MockLLMClient requires vars.mockData for complex schemas'); }
  }
}

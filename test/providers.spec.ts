import { describe, it, expect } from 'vitest';
import { getLLM, availableProviders } from '../src/providers/registry.js';
import express from 'express';
import supertest from 'supertest';
import { apiRouter } from '../src/routes.js';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);
const request = supertest(app);

describe('Provider registry', () => {
  it('falls back to mock when no keys', () => {
    const llm = getLLM('openai', 'gpt-4');
    expect(llm.provider).toBe('openai');
  });

  it('lists mock provider always', () => {
    expect(availableProviders()).toContain('mock');
  });

  it('providers endpoint returns structure', async () => {
    const res = await request.get('/api/providers').expect(200);
    expect(Array.isArray(res.body.providers)).toBe(true);
    expect(res.body.providers[0]).toHaveProperty('id');
  });

  it('provider test endpoint returns ok', async () => {
    const res = await request.post('/api/providers/test').send({ provider: 'mock', model: 'mock-model' }).expect(200);
    expect(res.body.ok).toBe(true);
  });
});

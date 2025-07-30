import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import { apiRouter } from '../src/routes.js';
import { ResearchBriefSchema, ExecutionPlanSchema } from '../src/spec/schemas.js';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

const request = supertest(app);

describe('Plan preview API', () => {
  it('should generate an execution plan without creating a run', async () => {
    const brief = ResearchBriefSchema.parse({
      objective: 'Test preview',
      scope: { domains: ['technology'] },
      deliverable: { format: 'report', length: 'short' },
      citations_required: false
    });
    const res = await request.post('/api/plan/preview').send({ brief }).expect(200);
    expect(() => ExecutionPlanSchema.parse(res.body)).not.toThrow();
    expect(res.body.steps.length).toBeGreaterThan(0);
    const search = res.body.steps.find((s:any)=>s.action==='SEARCH');
    expect(search?.params).toBeTypeOf('object');
  });
});

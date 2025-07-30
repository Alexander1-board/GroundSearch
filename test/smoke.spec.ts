// path: test/smoke.spec.ts
import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import app from '../src/server.js';
import { ResearchBriefSchema } from '../src/spec/schemas.js';
import * as runStorage from '../src/lib/run-storage.js';
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';

const request = supertest(app);
const RUNS_DIR = path.resolve(process.cwd(), 'runs');

// Helper to poll for completion by checking the events file
async function waitForRunCompletion(runId: string, timeoutMs = 15000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        try {
            const events = await runStorage.getEvents(runId);
            if (events.some(e => e.type === 'complete')) {
                const hasError = events.some(e => e.type === 'error' || e.type === 'step_error');
                if (hasError) console.error("Run completed with an error", events.filter(e => e.type === 'error' || e.type === 'step_error'));
                return !hasError;
            }
        } catch (e) {
            // Ignore file-not-found errors initially
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.error(`Timeout waiting for run ${runId} to complete.`);
    return false;
}


describe.skip('API Smoke Test', () => {
    let runId: string;

    const brief = ResearchBriefSchema.parse({
        objective: "Smoke test for API workflow.",
        key_questions: ["Does the API work end-to-end with mocked data?"],
        scope: { domains: ["clinical", "technology"] },
        deliverable: { format: "report", length: "short" },
        citations_required: false,
    });

    // Cleanup runs directory before all tests
    beforeAll(async () => {
        await fs.rm(RUNS_DIR, { recursive: true, force: true });
        await fs.mkdir(RUNS_DIR, { recursive: true });
    });


    it('POST /api/agent/start should accept a brief and return a runId', async () => {
        const response = await request
            .post('/api/agent/start')
            .send({ brief, model: 'gemini-2.5-flash' })
            .expect(200);

        expect(response.body).toHaveProperty('runId');
        expect(response.body.runId).toBeTypeOf('string');
        runId = response.body.runId;
    });
    
    it('should complete the run successfully using file-based storage and SSE', async () => {
        expect(runId).toBeDefined();
        const events: any[] = [];
        const stream = await fetch(`http://localhost:3000/api/agent/${runId}/stream`);
        const reader = stream.body!.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        const readLoop = async () => {
            while(true){
                const {value, done} = await reader.read();
                if(done) break;
                buf += decoder.decode(value, {stream:true});
                let idx;
                while((idx = buf.indexOf('\n\n')) >= 0){
                    const chunk = buf.slice(0, idx); buf = buf.slice(idx+2);
                    const typeLine = chunk.split('\n').find(l=>l.startsWith('event:'));
                    const dataLine = chunk.split('\n').find(l=>l.startsWith('data:'));
                    if(dataLine){
                        const ev = JSON.parse(dataLine.slice(5));
                        ev.type = typeLine?typeLine.slice(6).trim():ev.type;
                        events.push(ev);
                        if(ev.type==='complete' || ev.type==='error') return;
                    }
                }
            }
        };
        await Promise.race([readLoop(), new Promise(r=>setTimeout(r,15000))]);
        reader.cancel();

        const completed = events.some(e => e.type === 'complete');
        expect(completed, 'The agent run did not complete successfully in time.').toBe(true);
        expect(events.some(e => e.type === 'step_start')).toBe(true);
    }, 20000);

    it('should generate events and artifacts on the filesystem', async () => {
        expect(runId).toBeDefined();
        const events = await runStorage.getEvents(runId);
        expect(events.length).toBeGreaterThan(5); // created, phase, step_start, artifact, complete etc.
        expect(events.some(e => e.type === 'step_start')).toBe(true);
        expect(events.some(e => e.type === 'artifact')).toBe(true);
        expect(events.some(e => e.type === 'complete')).toBe(true);
        
        const finalReport = await runStorage.getArtifact(runId, 'final-report.json');
        expect(finalReport).not.toBeNull();
    });


    it('POST /api/report/generate should return a report for a completed run', async () => {
        expect(runId).toBeDefined();
        
        const response = await request
            .post('/api/report/generate')
            .send({ runId })
            .expect(200);

        expect(response.body).toHaveProperty('markdown');
        expect(response.body).toHaveProperty('comparisonTable');
        expect(response.body.markdown.length).toBeGreaterThan(150);
        expect(response.body.comparisonTable.rows.length).toBeGreaterThanOrEqual(1);
        // ensure quant/qual columns included
        expect(response.body.comparisonTable.headers).toContain('Quant Score');
    });
});

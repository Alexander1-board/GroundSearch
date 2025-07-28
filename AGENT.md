// path: AGENT.md
# AutoResearch — Codex Agent Guide

This file tells Codex **exactly how to work in this repo**: what to run, what to change, and how to validate before returning a diff.

---

## Repo Overview

**Goal:** Backend scaffold for a multi‑agent research app (“AutoResearch”).  
**Stack:** Node 20+, TypeScript (ESM), Express, Vitest.  
**Execution flow:** Interview → Orchestrator → Specialist adapters (PubMed, arXiv, Wolfram) → Screening/Comparison → Report.

**Key directories/files**
- `src/server.ts` — app bootstrap, middleware, error handler.
- `src/routes.ts` — REST API: interview, start run, **SSE** stream, report.
- `src/dispatcher.ts` — executes `ExecutionPlan` steps, emits events, saves artifacts.
- `src/lib/`
  - `logger.ts` — JSON logs; respects `LOG_LEVEL`.
  - `http.ts` — `fetchWithRetry` (retries, timeout, token‑bucket limiter).
  - `run-storage.ts` — file‑backed storage under `./runs/<runId>/`.
  - `sleep.ts`.
- `src/spec/` — Zod schemas (`ResearchBrief`, `ExecutionPlan`, etc.) and prompt strings.
- `src/agents/` — interview, orchestrator, screening, synthesis.
- `src/adapters/` — source adapters (fixture‑backed).
- `test/` — Vitest suite + fixtures in `test/fixtures/`.

**ESM note:** Use ESM imports with explicit `.js` extensions in TS (`"type":"module"`).

---

## Codex Modes

- **Ask mode** — audits, planning, Q&A. **No code changes**.
- **Code mode (default here)** — implement features/refactors/tests and return a **diff**.

---

## Environment & Setup

- **Container image:** `openai/codex-universal` (default is fine).
- **Node:** 20.x (configured in environment settings if needed).

**Install/build/test sequence (must pass before returning a diff)**
```bash
npm i
npm run build
npm test
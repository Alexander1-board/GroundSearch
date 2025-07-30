# UX Flow

## Home
- **Elements:** "New Interview" button, "New Run (Blank)" button, "Config" button, recent runs table.
- **On load:** `GET /api/runs` → `[ { runId, status, startedAt, updatedAt } ]`.
- **Table actions:** Open dashboard, view plan JSON, or generate report.
- **New Interview:** navigate to `/interview` (no API call).
- **New Run (Blank):** open modal, textarea for `ResearchBrief` JSON. Submit → `POST /api/agent/start` with `{ brief }` → returns `{ runId:"abc" }` then redirect to `/run/{runId}`.
- **Config:** navigate to `/config`.

## Config
- **Elements:** Provider dropdown, Model dropdown, Interview Preprompt textarea, Enabled Tools checklist, "Save" and "Test Credentials" buttons. When available, a "Secrets" tab lets you set provider API keys.
- **On load:**
  - `GET /api/config` → current config JSON.
  - `GET /api/providers` → `{ providers:[{id,models,available}] }`.
  - `GET /api/config/secrets` → `{ flags:{ KEY:true|false }, canEdit }`.
- **Save:** `PUT /api/config` with the form fields then return to Home.
- **Secrets Save:** `PUT /api/config/secrets` (dev only).
- **Test Credentials:** `POST /api/providers/test` with `{ provider, model }` → shows success/error toast.

## Interview
- **Elements:** message list, live outline panel, input box, "Send" button, "Use as Brief" button.
- **On mount:** `POST /api/chat/start` → `{ sessionId, message, outline }`.
- **Send:** `POST /api/chat/{sessionId}/reply` with `{ message }` → returns `{ reply, outline }` which updates the conversation and outline.
- **Use as Brief:** `POST /api/interview/finalise` with `{ sessionId }` → returns a complete `ResearchBrief` which is saved to `localStorage` and navigates to `/plan`.

## Plan
- **Elements:** provider/model chips, scope summary line, read-only query previews (PubMed/arXiv/Wolfram/Leaks), grouped step details with collapsible Instructions, "Run" and "Back" buttons.
- **On load:**
  - `POST /api/plan/preview` with `{ brief }` from localStorage → returns `ExecutionPlan`.
  - `GET /api/config` to show provider/model chips.
- **Run:** `POST /api/agent/start` with `{ brief }` → returns `{ runId:"abc" }` then navigate to `/run/{runId}`.

## Run Dashboard
- **Elements:** Overview badges, Timeline (each row can show ℹ️ instructions), API Activity chart with Top URLs table, Evidence charts, Artifacts list with filter, controls for Pause/Resume and Expand/Collapse, keyboard help overlay.
- **On mount:** `GET /api/agent/{runId}/stream` (SSE) → events `phase`, `step_start`, `artifact`, `api_call`, `complete`.
- **Artifacts:** "Open" fetches `/{path}` as JSON, "Download" uses direct link. "Generate Report" (after complete) → `POST /api/report/generate` with `{ runId }` then go to `/report/{runId}`.

## Report
- **Elements:** Export `.md` and `.json` buttons, rendered markdown, comparison table.
- **On load:** `POST /api/report/generate` with `{ runId }`.
- **Export buttons:** `POST /api/report/export?runId={runId}&format=md|json` → triggers file download.

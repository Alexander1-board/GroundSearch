# UX Flow

1. **Config Screen**
   - GET `/api/config`
   - PUT `/api/config`
   - GET `/api/providers`
2. **Interview Chat**
   - POST `/api/chat/start`
   - POST `/api/chat/{id}/reply`
   - GET  `/api/chat/{id}/stream`
3. **Plan Review**
   - POST `/api/interview/finalise`
   - POST `/api/plan/preview`
   - POST `/api/agent/start`
   - GET `/api/agent/{runId}/plan`
4. **Run Monitor**
   - GET `/api/agent/{runId}/stream`
   - GET `/api/runs`
   - POST `/api/report/generate`
5. **Report Screen**
   - GET `/api/report/export?runId=<id>&format=md`

## Browser UI pages
1. **Home** - loads runs via `GET /api/runs` on mount.
2. **Config** - loads config and providers on mount. PUT `/api/config` on save.
3. **Interview** - POST `/api/chat/start` on mount, POST `/api/chat/{id}/reply` for each send. `POST /api/interview/finalise` then navigate to Plan.
4. **Plan** - POST `/api/plan/preview` on load, `POST /api/agent/start` on Run.
5. **Run Dashboard** - connects to SSE `GET /api/agent/{runId}/stream` and renders:
   - Overview badges (status, events, steps)
   - Timeline list from `step_start` and `artifact`
   - API Activity chart from `api_call`
   - Evidence charts when `screened-evidence.json` artifact arrives
   - Artifacts list linking to stored JSON files
   - Controls to pause/resume the stream and collapse sections
   - Link to Report via `POST /api/report/generate`
6. **Report** - POST `/api/report/generate` on load.

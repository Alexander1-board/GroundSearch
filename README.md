# AutoResearch API

This project is a minimal, working TypeScript/Node scaffold for AutoResearch, a multi-agent research app.

## Quick Start

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up environment variables:**
    Copy the example environment file. The app will work in a mocked mode without API keys, using test fixtures.
    ```bash
    cp .env.example .env
    ```
    To make live API calls, fill in `WOLFRAM_APPID` and `NCBI_API_KEY`. `OPENALEX_EMAIL` is optional.

    The app reads additional preferences from `.data/user-config.json`. You can change the default LLM provider, model, and the `interview_preprompt` used to guide the chat interview.

    ```json
    {
      "default_provider": "gemini",
      "default_model": "gemini-2.5-flash",
      "interview_preprompt": "You are a helpful research assistant..."
    }
    ```

3.  **Run the development servers (API + UI):**
    ```bash
    npm run dev:all
    ```
    This starts the API server on `http://localhost:3000` and the Vite UI on `http://localhost:5173` (proxying API requests).
    If you only need the API server, run `npm run dev` instead.

4.  **Run tests:**
    ```bash
    npm test
    ```

## API Demo Flow (using `curl` and `jq`)

Here's how to interact with the API endpoints.

### Provider Info

Check which LLM providers are available:

```bash
curl -s http://localhost:3000/api/providers | jq .
```

### 1. Finalise the Research Brief

The `interview/finalise` endpoint uses a mock LLM to return a pre-defined, valid `ResearchBrief`.

```bash
# This command will return a structured ResearchBrief JSON object.
curl -s -X POST http://localhost:3000/api/interview/finalise \
-H "Content-Type: application/json" \
-d '{
  "transcript": [{"role": "user", "content": "Tell me about GLP-1 agonists for weight loss."}],
  "current_outline": "Brief on GLP-1 agonists"
}' > brief.json

echo "Research brief saved to brief.json"
```

### 2. Start the Research Agent

Use the `brief.json` file to start the agent. This will return a `runId`.

```bash
# Start the agent and capture the runId using jq
RUN_ID=$(curl -s -X POST http://localhost:3000/api/agent/start \
-H "Content-Type: application/json" \
-d "{ \"brief\": $(cat brief.json), \"model\": \"gemini-2.5-flash\" }" | jq -r .runId)

echo "Agent started with runId: $RUN_ID"
```

### 3. Stream Progress with Server-Sent Events (SSE)

Use the `runId` to listen for real-time updates. The stream will replay past events, send live updates, stay open with keep-alive messages, and close automatically on `complete` or `error`.

```bash
# Connect to the stream
curl -N http://localhost:3000/api/agent/$RUN_ID/stream
```
You will receive a stream of events like:
```
event: phase
data: {"phase":"planning","message":"Orchestration complete. Starting execution."}

event: step_start
data: {"step":{...}}

event: complete
data: {"message":"Research complete."}
```

### 4. Generate the Final Report

After the `complete` event is received, fetch the final report from the persisted artifacts.

```bash
# This endpoint retrieves the pre-generated report artifact.
curl -s -X POST http://localhost:3000/api/report/generate \
-H "Content-Type: application/json" \
-d "{ \"runId\": \"$RUN_ID\" }" | jq .
```

This will print the final JSON report, which contains the markdown and a structured comparison table.
```json
{
  "markdown": "# Report on New Diabetes Treatments...",
  "comparisonTable": {
    "headers": ["Treatment", "Key Finding", "Year"],
    "rows": [
      ["Mock PubMed Art...", "The abstract ...", 2023]
    ]
  }
}
```

### 5. Explore Stored Runs

List all runs with basic status:

```bash
curl -s http://localhost:3000/api/runs | jq .
```

Retrieve the saved execution plan for a run:

```bash
curl -s http://localhost:3000/api/agent/$RUN_ID/plan | jq .
```

### 6. Chat Interview

Start a chat session and stream messages:

```bash
curl -s -X POST http://localhost:3000/api/chat/start | jq .
curl -s -X POST http://localhost:3000/api/chat/$SESSION_ID/reply -d '{"message":"Hello"}'
curl -N http://localhost:3000/api/chat/$SESSION_ID/stream
```
## Run the UI
- Development: `npm run dev:all` and open http://localhost:5173 (proxy to backend)
- Production: `npm run build && npm run web:build && npm start` then open http://localhost:3000
The Run Dashboard at `/run/:id` shows live progress with collapsible charts.


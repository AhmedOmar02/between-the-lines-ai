# BetweenTheLines.AI

## Overview
A backend web service that analyzes a sentence and generates possible interpretations to help users avoid misunderstandings during communication.

## Problem Statement
Many sentences can have multiple meanings depending on context. Misunderstandings often occur when people interpret the same sentence differently. This project helps users explore possible interpretations before responding.

## Objectives
- Analyze user-provided sentences.
- Generate multiple possible meanings.
- Explain why each interpretation is valid.
- Identify the emotional tone behind each interpretation.
- Improve communication clarity.

## Scope (Phase 1 — MVP)
This is the scope for the first build. No user accounts, no auth, no persistence.

**In scope:**
- Sentence analysis endpoint (stateless, no login required).
- Optional context fields (relationship type, channel, background) sent with the sentence.
- Multiple interpretation generation via DeepSeek.
- Tone detection per interpretation.

**Out of scope for Phase 1 (see "Future Enhancements"):**
- User accounts / authentication.
- Saving or viewing history of past analyses.
- MongoDB persistence.
- Rate limiting / multi-tenant usage controls.

## Tech Stack

### Backend
- Node.js (LTS)
- Express.js

### AI Integration
- DeepSeek API (OpenAI-compatible wire format)
- Model: `deepseek-v4-flash`
  - **Do not use the legacy `deepseek-chat` model name** — it is being retired on **July 24, 2026**. Build directly against `deepseek-v4-flash`.
  - Base URL: `https://api.deepseek.com`
  - Use the official `openai` npm SDK pointed at the DeepSeek base URL (the wire format is OpenAI-compatible, so the SDK works unmodified).

### Database
- MongoDB — **deferred to Phase 2** (not required for the MVP build; do not wire up a DB connection in Phase 1).

### Version Control
- Git / GitHub

## System Architecture

```
Client
  ↓
Express API (routes → middleware → controllers)
  ↓
AI Service Layer (services/aiService.js)
  ↓
DeepSeek API (deepseek-v4-flash)
```

The AI Service Layer is the only part of the codebase that knows about DeepSeek. Controllers never call the AI provider directly — this keeps the provider swappable later without touching routes or controllers.

## Functional Requirements
- FR1: User can submit a sentence for analysis via `POST /api/analyze`.
- FR2: User can optionally provide context: `relationshipType`, `channel`, `background`.
- FR3: The system shall analyze the submitted sentence using the DeepSeek AI model.
- FR4: The system shall return 2–4 distinct possible interpretations per sentence.
- FR5: Each interpretation shall include an explanation of why that reading is plausible.
- FR6: The system shall identify an emotional tone for each interpretation (e.g., neutral, friendly, frustrated, sarcastic, anxious, affectionate).
- FR7: The system shall return a `dominantTone` summarizing the overall likely tone.
- FR8: The system shall validate that `sentence` is present and non-empty before calling the AI service.
- FR9: The system shall expose a health-check endpoint for uptime monitoring.

## Non-Functional Requirements
- NFR1: Total response time under 5 seconds for a typical request (single AI call, no retries).
- NFR2: The AI call shall time out at 4 seconds and fail gracefully with a clear error rather than hanging.
- NFR3: API responses shall follow a consistent JSON envelope (`success`, `data`/`error`).
- NFR4: No secrets (API keys) committed to source control — all config via environment variables.
- NFR5: The system shall support increasing request volume without significant degradation (stateless request handling, no in-memory session state).

## Data Model (Response Shape)
No database in Phase 1 — this defines the shape of data passed between the AI Service Layer and the API response, not a persisted schema.

```ts
interface Interpretation {
  meaning: string;       // the possible interpretation, in plain language
  explanation: string;   // why this reading is plausible
  tone: string;          // e.g. "neutral", "frustrated", "sarcastic"
}

interface AnalysisResult {
  interpretations: Interpretation[];
  dominantTone: string;
  processingTimeMs: number;
}
```

## API Endpoints

### `POST /api/analyze`
Analyze a sentence and return possible interpretations.

**Request body:**
```json
{
  "sentence": "Fine, do whatever you want.",
  "context": {
    "relationshipType": "partner",
    "channel": "text",
    "background": "We were discussing weekend plans."
  }
}
```
`sentence` is required. `context` and all its fields are optional.

**Success response — `200`:**
```json
{
  "success": true,
  "data": {
    "interpretations": [
      {
        "meaning": "Genuine agreement, no hidden frustration.",
        "explanation": "Could be a sincere hand-off of the decision with no negative undertone.",
        "tone": "neutral"
      },
      {
        "meaning": "Passive-aggressive resignation.",
        "explanation": "The brevity and 'whatever you want' phrasing often signal suppressed annoyance.",
        "tone": "frustrated"
      }
    ],
    "dominantTone": "frustrated",
    "processingTimeMs": 1840
  }
}
```

**Error responses:**
```json
// 400 — validation error
{ "success": false, "error": "sentence is required" }

// 502 — AI service failed or returned invalid output
{ "success": false, "error": "AI service unavailable, please try again" }

// 504 — AI call exceeded internal timeout
{ "success": false, "error": "Analysis timed out, please try again" }
```

### `GET /api/health`
Simple liveness check for uptime monitoring / load balancers.

**Response — `200`:**
```json
{ "status": "ok" }
```

## AI Integration Details

- Send a **single** chat completion request per analysis (don't make multiple round trips for interpretations vs. tone — combine them in one prompt/response for latency).
- Use `response_format: { type: "json_object" }` on the DeepSeek request so the model is constrained to return valid JSON, and instruct it explicitly (in the system prompt) to return JSON matching the `AnalysisResult` shape above.
- Build the prompt in `utils/promptBuilder.js`, not inline in the service — keep prompt text out of the request-handling logic so it's easy to iterate on independently.
- The system prompt should instruct the model to:
  - Return 2–4 interpretations, not more.
  - Ground each interpretation in the optional context fields when provided.
  - Keep `tone` values to a small consistent vocabulary (neutral, friendly, frustrated, sarcastic, anxious, affectionate, dismissive, apologetic — extend as needed, but keep it a closed set so the frontend can map tones to consistent UI treatment later).
- Wrap the DeepSeek call with a 4-second timeout. On timeout or malformed JSON response, return the `504`/`502` errors defined above — never let a bad AI response leak through as a 200.

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── env.js              # loads & validates required env vars at startup
│   ├── controllers/
│   │   └── analysisController.js
│   ├── routes/
│   │   └── analysisRoutes.js
│   ├── services/
│   │   └── aiService.js        # AI Service Layer — only file that talks to DeepSeek
│   ├── middleware/
│   │   ├── errorHandler.js     # centralized error → JSON envelope
│   │   └── validateRequest.js  # validates POST /api/analyze body
│   ├── utils/
│   │   └── promptBuilder.js    # builds the system/user prompt sent to DeepSeek
│   ├── app.js                  # express app: middleware, routes, error handler
│   └── server.js               # entry point, starts the HTTP server
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Environment Variables

`.env.example`:
```
PORT=3000
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
AI_TIMEOUT_MS=4000
```

`config/env.js` should fail fast at startup (throw / `process.exit(1)`) if `DEEPSEEK_API_KEY` is missing — don't let the server boot into a state where it can't serve its core feature.

## Installation

```bash
git clone <your-repo-url>
cd backend
npm install
cp .env.example .env        # then fill in DEEPSEEK_API_KEY
npm run dev                 # nodemon, for local development
```

`package.json` scripts:
```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
```

**Core dependencies:** `express`, `dotenv`, `openai`, `cors`, `express-validator`
**Dev dependencies:** `nodemon`

## Build Instructions (for an AI coding agent implementing this)

Implement in this order so each piece is testable before the next depends on it:

1. Initialize the Node.js project (`npm init`) and install the dependencies listed above.
2. Create `.env.example` and `.gitignore` (standard Node ignores: `node_modules`, `.env`, logs).
3. Build `config/env.js` — loads `dotenv`, validates required vars, exports a typed config object.
4. Build `utils/promptBuilder.js` — pure function: `(sentence, context) => { systemPrompt, userPrompt }`.
5. Build `services/aiService.js` — wraps the `openai` SDK pointed at DeepSeek, calls the model with the built prompt, applies the timeout, parses and validates the JSON response against the `AnalysisResult` shape, throws typed errors on failure (timeout vs malformed response vs upstream error).
6. Build `middleware/validateRequest.js` — validates `sentence` is a non-empty string; `context` fields are optional strings.
7. Build `middleware/errorHandler.js` — catches thrown errors, maps them to the `400`/`502`/`504` JSON envelopes defined above.
8. Build `controllers/analysisController.js` — calls `aiService`, measures `processingTimeMs`, returns the success envelope.
9. Build `routes/analysisRoutes.js` — wires `POST /api/analyze` and `GET /api/health`.
10. Build `app.js` (express app + middleware + routes + error handler) and `server.js` (starts the server using `config.PORT`).
11. Manually verify with curl:
    ```bash
    curl -X POST http://localhost:3000/api/analyze \
      -H "Content-Type: application/json" \
      -d '{"sentence":"Fine, do whatever you want."}'
    ```
12. Verify the failure paths: empty `sentence` → `400`; temporarily break `DEEPSEEK_API_KEY` → `502`.

### Acceptance Criteria (Phase 1 MVP)
- [ ] `POST /api/analyze` returns 2–4 interpretations with `meaning`, `explanation`, and `tone` for a valid sentence.
- [ ] Missing or empty `sentence` returns `400` with a clear error message.
- [ ] AI timeout or upstream failure returns `502`/`504`, never a malformed `200`.
- [ ] `GET /api/health` returns `200` with `{ "status": "ok" }`.
- [ ] No secrets committed to the repo; `.env` is gitignored.
- [ ] Typical request completes in under 5 seconds.

## Future Enhancements (Phase 2)
- User accounts: registration, login, secure session/token handling.
- Persist analyses to MongoDB, scoped per user.
- `GET /api/analyses` and `GET /api/analyses/:id` to list/view saved history.
- Rate limiting per user/IP.
- Multi-language sentence support.

## Contributors
- _Add contributors here._

## License
- _Add license here (MIT is a common default for open-source projects)._

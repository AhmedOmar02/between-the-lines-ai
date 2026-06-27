# BetweenTheLines.AI — Backend

A stateless REST API that analyzes a sentence and returns multiple possible interpretations, helping users avoid miscommunication.

## Quick Start

```bash
git clone https://github.com/AhmedOmar02/between-the-lines-ai.git
cd between-the-lines-ai
npm install
cp .env.example .env   # then fill in your DEEPSEEK_API_KEY
npm run dev
```

## Environment Variables

| Variable           | Required | Default                        | Description                        |
|--------------------|----------|--------------------------------|------------------------------------|
| `DEEPSEEK_API_KEY` | ✅ yes   | —                              | get from openrouter.ai             |
| `PORT`             | no       | `3000`                         | Port the server listens on         |
| `DEEPSEEK_BASE_URL`| no       | `https://openrouter.ai/api/v1` | DeepSeek API base URL              |
| `DEEPSEEK_MODEL`   | no       | `qwen/qwen3.5-plus-20260420    | Model to use                       |
| `AI_TIMEOUT_MS`    | no       | `100000`                       | Max ms to wait for the AI response |

The server will **refuse to start** if `DEEPSEEK_API_KEY` is missing.

## API

### `POST /api/analyze`

Analyze a sentence and return 2–4 interpretations.

**Request:**
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
`sentence` is required. `context` and all its sub-fields are optional.

**Success (200):**
```json
{
  "success": true,
  "data": {
    "interpretations": [
      {
        "meaning": "Genuine agreement with no hidden frustration.",
        "explanation": "Could be a sincere hand-off of the decision.",
        "tone": "neutral"
      },
      {
        "meaning": "Passive-aggressive resignation.",
        "explanation": "The brevity and phrasing often signal suppressed annoyance.",
        "tone": "frustrated"
      }
    ],
    "dominantTone": "frustrated",
    "processingTimeMs": 1840
  }
}
```

**Errors:**
| Status | Cause                              |
|--------|------------------------------------|
| 400    | Missing or empty `sentence`        |
| 502    | AI service error / malformed reply |
| 504    | AI call exceeded timeout           |

### `GET /api/health`
```json
{ "status": "ok" }
```

## Project Structure

```
src/
├── config/env.js              # Loads & validates env vars at startup
├── controllers/
│   └── analysisController.js  # Calls AI service, returns response
├── routes/
│   └── analysisRoutes.js      # POST /api/analyze, GET /api/health
├── services/
│   └── aiService.js           # Only file that talks to DeepSeek
├── middleware/
│   ├── errorHandler.js        # Maps typed errors → JSON envelopes
│   └── validateRequest.js     # Validates request body
├── utils/
│   └── promptBuilder.js       # Builds system/user prompts
├── app.js                     # Express app setup
└── server.js                  # Entry point
```

## Verify with curl

```bash
# Happy path
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"sentence":"Fine, do whatever you want.", "context": {"relationshipType": "partner", "channel": "text"}}'

# Validation error (expect 400)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{}'

# Health check
curl http://localhost:3000/api/health
```

## Scripts

| Command       | Description                          |
|---------------|--------------------------------------|
| `npm run dev` | Start with nodemon (auto-reload)     |
| `npm start`   | Start for production                 |

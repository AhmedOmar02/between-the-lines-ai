# BetweenTheLines.AI — Backend

A REST API that analyzes a sentence and returns multiple possible interpretations, helping users avoid miscommunication. Every analysis is saved per-user in MongoDB.

## Quick Start

```bash
git clone https://github.com/AhmedOmar02/between-the-lines-ai.git
cd between-the-lines-ai
npm install
cp .env.example .env   # then fill in DEEPSEEK_API_KEY, MONGODB_URI, JWT_SECRET
npm run dev
```

## Environment Variables

| Variable           | Required | Default                        | Description                        |
|--------------------|----------|--------------------------------|------------------------------------|
| `DEEPSEEK_API_KEY` | ✅ yes   | —                              | get from openrouter.ai             |
| `MONGODB_URI`      | ✅ yes   | —                              | MongoDB Atlas connection string    |
| `JWT_SECRET`       | ✅ yes   | —                              | Secret used to sign auth tokens    |
| `PORT`             | no       | `3000`                         | Port the server listens on         |
| `DEEPSEEK_BASE_URL`| no       | `https://openrouter.ai/api/v1` | DeepSeek API base URL              |
| `DEEPSEEK_MODEL`   | no       | `qwen/qwen3.5-plus-20260420    | Model to use                       |
| `AI_TIMEOUT_MS`    | no       | `100000`                       | Max ms to wait for the AI response |
| `JWT_EXPIRES_IN`   | no       | `7d`                           | Auth token lifetime                |

The server will **refuse to start** if `DEEPSEEK_API_KEY`, `MONGODB_URI`, or `JWT_SECRET` is missing.

## API

All endpoints below except `/api/auth/*` and `/api/health` require an `Authorization: Bearer <token>` header, obtained from register/login.

### `POST /api/auth/register`

**Request:**
```json
{ "email": "user@example.com", "password": "hunter22222" }
```
`password` must be at least 8 characters.

**Success (201):**
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "id": "665f1...", "email": "user@example.com" }
  }
}
```

**Errors:**
| Status | Cause                          |
|--------|---------------------------------|
| 400    | Missing/invalid email or password |
| 409    | Email already registered        |

### `POST /api/auth/login`

**Request:**
```json
{ "email": "user@example.com", "password": "hunter22222" }
```

**Success (200):** same shape as register.

**Errors:**
| Status | Cause                        |
|--------|-------------------------------|
| 400    | Missing email or password      |
| 401    | Invalid email or password       |

### `POST /api/analyze` 🔒

Analyze a sentence and return 2–4 interpretations. The result is auto-saved to the caller's history.

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
| 401    | Missing/invalid/expired token       |
| 502    | AI service error / malformed reply |
| 504    | AI call exceeded timeout           |

### `GET /api/analyses` 🔒

Paginated, newest-first history for the authenticated user.

**Query params:** `page` (default `1`), `limit` (default `20`, max `100`).

**Success (200):**
```json
{
  "success": true,
  "data": {
    "analyses": [ /* Analysis documents */ ],
    "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
  }
}
```

### `GET /api/analyses/:id` 🔒

**Success (200):** the Analysis document, if owned by the caller.

**Errors:**
| Status | Cause                                  |
|--------|-----------------------------------------|
| 401    | Missing/invalid/expired token           |
| 404    | Not found, or not owned by the caller   |

### `GET /api/health`
```json
{ "status": "ok" }
```

## Project Structure

```
src/
├── config/
│   ├── env.js                  # Loads & validates env vars at startup
│   └── db.js                   # Mongoose connection
├── models/
│   ├── User.js                 # email, passwordHash
│   └── Analysis.js             # per-user saved analysis results
├── controllers/
│   ├── authController.js       # register, login
│   └── analysisController.js   # analyze, listAnalyses, getAnalysisById
├── routes/
│   ├── authRoutes.js           # POST /api/auth/register, /api/auth/login
│   └── analysisRoutes.js       # POST /api/analyze, GET /api/analyses(/:id), GET /api/health
├── services/
│   └── aiService.js            # Only file that talks to DeepSeek
├── middleware/
│   ├── authenticate.js         # Verifies Bearer token, sets req.userId
│   ├── errorHandler.js         # Maps typed errors → JSON envelopes
│   └── validateRequest.js      # Validates request bodies
├── utils/
│   ├── jwt.js                  # signToken / verifyToken
│   └── promptBuilder.js        # Builds system/user prompts
├── app.js                      # Express app setup
└── server.js                   # Entry point
```

## Verify with curl

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"hunter22222"}'

# Login (save the returned token)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"hunter22222"}' | jq -r .data.token)

# Happy path
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"sentence":"Fine, do whatever you want.", "context": {"relationshipType": "partner", "channel": "text"}}'

# History
curl http://localhost:3000/api/analyses?page=1&limit=10 \
  -H "Authorization: Bearer $TOKEN"

# Validation error (expect 400)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'

# Health check
curl http://localhost:3000/api/health
```

## Scripts

| Command       | Description                          |
|---------------|--------------------------------------|
| `npm run dev` | Start with nodemon (auto-reload)     |
| `npm start`   | Start for production                 |

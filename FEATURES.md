# FEATURES.md

A running list of feature ideas and implementation plans for **BetweenTheLines.AI**.

---

## 1. Accounts & Persistence (Next Up)

Add user accounts and MongoDB persistence so analyses are saved per-user instead of being stateless.

**Stack decisions:**
- Database: MongoDB Atlas (free M0 tier)
- Auth: JWT (`jsonwebtoken`) + password hashing (`bcryptjs`)
- Behavior: every `POST /api/analyze` result is **auto-saved** to the DB (no opt-in flag needed)

**Build order (for Claude Code, one step at a time):**

1. **DB connection** — add Mongoose, `MONGODB_URI` env var, `src/config/db.js`, call `connectDB()` in `server.js`.
2. **User model** — `src/models/User.js`: `email` (unique), `passwordHash`, `createdAt`.
3. **Analysis model** — `src/models/Analysis.js`: `userId` (ref User), `sentence`, `context`, `interpretations`, `dominantTone`, `processingTimeMs`, `createdAt`.
4. **JWT utils** — `src/utils/jwt.js`: `signToken(userId)`, `verifyToken(token)`, new `JWT_SECRET` env var.
5. **Auth middleware** — `src/middleware/authenticate.js`: verifies Bearer token, sets `req.userId`, 401 on failure.
6. **Auth controller + routes** — `src/controllers/authController.js` (`register`, `login`), `src/routes/authRoutes.js` → `/api/auth/register`, `/api/auth/login`.
7. **Wire auth into analyze** — require `authenticate` on `POST /api/analyze`; controller saves every result to `Analysis` with `req.userId`.
8. **History endpoints** — `GET /api/analyses` (paginated, newest-first, `?page=&limit=`), `GET /api/analyses/:id` (404 if not owned by `req.userId`), both behind `authenticate`.
9. **Error handling updates** — Mongoose validation errors (400), duplicate email on register (409), JWT errors (401).
10. **Docs update** — README + `.env.example` get `MONGODB_URI`, `JWT_SECRET`, and the new `/api/auth/*` / `/api/analyses*` endpoints documented in the existing style.

---

## 2. Arabic Language Support

Add a `language` option so the API can respond in Arabic as well as English — no new API key needed, since `nvidia/nemotron-3-ultra-550b-a55b` (free tier via OpenRouter) officially supports Arabic.

- Add optional `language` field to the analyze request (`"en" | "ar"`, default `"en"`).
- Update `promptBuilder.js` to accept a `language` param:
  - Instruct the model to respond in Modern Standard Arabic for `meaning` / `explanation` fields when `language === "ar"`.
  - Keep `tone` / `dominantTone` as the fixed English enum values regardless of language, for consistent filtering/logic on the frontend.
- Pass `language` through `analysisController.js` → `analyzeSentence()` → `buildPrompt()`.
- RTL rendering is a frontend concern only (`dir="rtl"` + Arabic font) — backend just needs to return correct UTF-8 Arabic text.
- **Watch for:** reasoning-model leakage (e.g. `<think>` traces) in the response, especially when switching languages mid-instruction — verify `aiService.js`'s JSON parsing still works cleanly in Arabic mode, and strip reasoning blocks if needed.

---

## 3. Other Feature Ideas (Backlog)

### Quick wins
- **Reply-mode endpoint** — given a sentence + chosen interpretation + desired tone, draft 2–3 possible replies. Reuses the existing `promptBuilder` pattern.
- **Confidence scores** — have the model return a 0–100 likelihood per interpretation instead of a flat list.
- **Batch analysis** — `POST /api/analyze/batch` to analyze an array of sentences at once (e.g. a whole thread).
- **Streaming responses** — stream interpretations via SSE as they're generated instead of waiting for the full JSON, for a faster feel given multi-second response times.

### Bigger / "cool factor" features
- **Conversation thread analysis** — analyze a full back-and-forth conversation, producing a per-message tone map to spot where miscommunication or escalation started.
- **"Translate the subtext" mode** — output one plain-language "what they probably mean" summary plus a suggested clarifying question to send back, instead of a list of interpretations.
- **Tone drift detection** — analyze a sequence of messages over time and flag shifts in tone (e.g. friendly → dismissive).
- **Cultural/context presets** — preset context templates (workplace Slack, texting a partner, parent-teen, cross-cultural) that adjust the system prompt framing.
- **Webhook / Slack integration** — right-click a Slack message to get "what did they mean by this?" — highly shareable.
- **Feedback loop** — let users mark which interpretation was correct after the fact; log it for future prompt tuning or an accuracy dashboard.

### From the original PROJECT_SPEC (Phase 2)
- User accounts, registration, login, secure session/token handling ✅ *(in progress — see Section 1)*
- Persist analyses to MongoDB, scoped per user ✅ *(in progress — see Section 1)*
- `GET /api/analyses` and `GET /api/analyses/:id` ✅ *(in progress — see Section 1)*
- Rate limiting per user/IP (currently global via `express-rate-limit`; could be scoped to `req.userId` once auth exists)
- Multi-language sentence support ✅ *(Arabic — see Section 2; extendable to other languages later)*

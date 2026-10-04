# Build prompt for Antigravity — MedVita

Paste everything below into Antigravity along with this project folder.

---

I have a finished, working frontend for **MedVita** — an AI-powered health symptom triage tool. It's a Next.js 15 (App Router) + TypeScript + Tailwind project. The UI is fully built and styled (design system: warm paper canvas, brick-red accent, Fraunces serif headlines + Inter body text) and currently runs entirely on hardcoded mock data. Your job is to build out the real backend and wire it up — but the actual AI API keys are NOT available yet, so structure things so the very last step, once I drop in keys, is the only thing left to do.

## What's already built (don't rebuild this)
- `app/page.tsx` — all four screens (auth, symptom input, results, follow-up thread) with full client-side state and mock data
- Reusable components in `components/`: header, chip groups, urgency badge (4 tiers: self-care / routine-gp / urgent-specialist / emergency), disclaimer, step tracker, mock loader
- Design tokens in `tailwind.config.ts` (the `vitaly` color palette) — keep using these, don't introduce new ad hoc colors
- `README.md` has the original frontend-only scope for reference

## What I need you to build

### 1. Auth (Clerk)
- Install and configure Clerk for Next.js App Router
- Email/magic-link sign-in only — no password field, no social logins
- Use `proxy.ts` for route protection, NOT `middleware.ts` — there's a known Next.js 16 conflict between the two when Clerk is involved, so proxy.ts is the safe pattern
- Protect all routes except the landing/auth screen — replace the current mock "Continue" button behavior with real Clerk sign-in, redirecting into the existing symptom flow once authenticated
- Set up Clerk's Third-Party Auth via JWKS so Supabase RLS policies can reference the Clerk user ID directly (not the older native Clerk-Supabase integration)

### 2. Database (Supabase)
- Set up Supabase with tables for:
  - `users` (or rely on Clerk user ID as the key — your call, but keep it simple)
  - `daily_usage`: tracks `questions_used_today` (integer) and `last_reset_date` per user, used to enforce the daily cap
  - `triage_cases`: stores each submitted case (symptom text, duration/severity/location chip values, photo reference if any, the AI result, timestamp) so follow-up threads can be scoped to a specific case
  - `follow_up_messages`: linked to a `triage_cases` row, stores the follow-up thread (role, text, timestamp)
- Row Level Security policies keyed on the Clerk user ID (via the JWKS integration above) so users can only read/write their own rows
- Daily reset logic: check `last_reset_date` against today's date on each request and reset `questions_used_today` to 0 if it's a new day (no need for a cron job — a check-and-reset on read is simpler and sufficient here)

### 3. The core rule: 5 total interactions per day, no separate caps
- Each user gets **5 questions per day total** — this covers both the initial symptom submission AND every follow-up message in a thread. There is no separate "follow-ups" allowance; it's one shared daily counter.
- Enforce this server-side (API route / server action), never trust a client-side counter alone — the UI's `DailyLimit` component already displays "X left today," just wire it to real data instead of local state
- When the limit is hit, return a clear response the UI can show (the `ThreadScreen` component already has a "you've reached today's limit" state — reuse that pattern for the symptom-submission screen too if the daily cap is hit there)

### 4. AI pipeline — build the structure now, leave the actual API calls stubbed
This is the important part: **I don't have my Anthropic and Gemini API keys yet.** Build the full pipeline architecture, routing, prompt construction, and response handling — but where the actual `fetch` call to Claude or Gemini would go, leave a clearly marked stub that returns realistic mock data matching the real response shape. I want the LAST step, once I have keys, to be: paste two environment variables in and remove the stub flag. Everything else — request validation, database writes, credit/usage deduction, error handling, response formatting for the UI — should already be fully working end to end against the stub.

Structure:
- **Image analysis step**: when a photo is included, this call goes to **Gemini** (specifically Gemini 3.7 Flash — not Flash-Lite; the reasoning is that Flash-Lite is fine for simple OCR/extraction tasks but photo-based symptom interpretation needs more capability, and the cost difference is negligible at this volume). Stub this as a function `analyzeImageWithGemini(imageData)` that returns a mock description object, with a `// TODO: replace with real Gemini API call once GEMINI_API_KEY is set` comment and the real fetch structure commented out above the stub so it's ready to uncomment.
- **Reasoning/classification step**: this is the main triage call, going to **Claude Sonnet 5**, run at high reasoning effort (not low/medium — this is explicitly a case where under-thinking risk is unacceptable given the health context). Stub this as `classifySymptoms(symptomText, chips, imageAnalysis, conditionDatabaseContext)` returning a mock object shaped exactly like `MOCK_RESULT` in the current `page.tsx` (urgency tier, action, summary, explanation paragraphs, possibilities array, reference text). Same TODO/commented-real-call pattern.
- **Grounding step**: before the Claude call, retrieve relevant entries from a `condition_reference` table (you can scaffold this table with a handful of placeholder rows — the real content will be sourced from NHS/MedlinePlus-style material later) and pass that as context into the Claude prompt. This is a real, working retrieval step even though the generation step downstream is stubbed.
- **Follow-up step**: same Claude Sonnet 5 call pattern, but scoped to the specific `triage_cases` row and its message history — also stubbed the same way.
- Use environment variables `ANTHROPIC_API_KEY` and `GEMINI_API_KEY`, both absent for now. Add a `.env.local.example` listing both with placeholder values and a comment saying they're not yet available. Gate the stub-vs-real behavior on whether the env var is present, so the code is genuinely ready to go live the moment I add both keys — no code changes needed at that point, just env vars.

### 5. Cost/session logic to wire up now (works independent of the API keys)
- Prompt caching structure: the condition-reference context should be assembled in a way that's cache-friendly (stable system-prompt-like content separate from the per-request user symptom text), even though the actual cache-hit billing only matters once real API calls are live
- Scope-lock validation: add a lightweight check (can be a simple keyword/heuristic check for now, doesn't need to be AI-based) that rejects clearly non-medical queries before they'd ever reach the AI step, to prevent the tool being used as a general chatbot

### 6. What NOT to do
- Don't touch the existing component styling/design — it's finished
- Don't add Perplexity or any other provider — just Gemini (image) and Claude (reasoning), as above
- Don't implement guest/no-signup mode — signup is mandatory
- Don't hardcode or invent any real API keys anywhere, including in example/test files

## Summary of what "done" looks like
A fully wired app where: a real user signs up via Clerk, submits symptoms (with optional photo), gets a response generated by the stubbed-but-structurally-complete AI pipeline (returning realistic mock data), can ask up to 5 total follow-ups a day tracked correctly in Supabase, and the entire AI layer is one environment-variable change away from going live with real Claude and Gemini calls.

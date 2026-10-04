-- ─────────────────────────────────────────────────────────────────────────────
-- MedVita Supabase Schema + RLS
--
-- SETUP ORDER:
--   1. In your Clerk dashboard → JWT Templates → New template → Supabase
--      Name it "supabase". Copy the JWKS endpoint URL (ends in /.well-known/jwks.json)
--   2. In Supabase → Settings → Auth → JWT Secret:
--      Select "Use a third-party JWT provider" and paste the JWKS endpoint URL
--   3. Run this SQL in the Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── EXTENSION ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── DAILY USAGE ─────────────────────────────────────────────────────────────
-- Tracks questions used per user per day (max 5, resets at midnight UTC)
CREATE TABLE IF NOT EXISTS daily_usage (
  user_id           TEXT PRIMARY KEY,        -- Clerk user ID (sub claim)
  questions_used    INTEGER NOT NULL DEFAULT 0 CHECK (questions_used >= 0 AND questions_used <= 5),
  last_reset_date   DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

-- Users can only read and update their own row
CREATE POLICY "daily_usage: own row read"
  ON daily_usage FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "daily_usage: own row insert"
  ON daily_usage FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "daily_usage: own row update"
  ON daily_usage FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id);

-- ── TRIAGE CASES ────────────────────────────────────────────────────────────
-- One row per symptom check. Stores the full AI result as JSONB.
CREATE TABLE IF NOT EXISTS triage_cases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         TEXT NOT NULL,              -- Clerk user ID
  symptoms        TEXT NOT NULL,
  duration        TEXT,
  severity        TEXT,
  location        TEXT,
  image_insight   TEXT,                       -- Gemini image analysis (if any)
  urgency         TEXT NOT NULL,              -- self-care | routine-gp | urgent-specialist | emergency
  action          TEXT NOT NULL,
  result_json     JSONB NOT NULL,             -- Full TriageResult object
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE triage_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "triage_cases: own rows only"
  ON triage_cases FOR ALL
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- ── FOLLOW-UP MESSAGES ──────────────────────────────────────────────────────
-- One row per message (user or assistant) in a follow-up thread.
CREATE TABLE IF NOT EXISTS follow_up_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id     UUID NOT NULL REFERENCES triage_cases(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,                 -- Clerk user ID
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE follow_up_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follow_up_messages: own rows only"
  ON follow_up_messages FOR ALL
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- ── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_triage_cases_user_id ON triage_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_messages_case_id ON follow_up_messages(case_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_messages_user_id ON follow_up_messages(user_id);

-- ── CONDITIONS (Health Reference Data) ──────────────────────────────────────
-- Stores parsed topics from MedlinePlus XML
CREATE TABLE IF NOT EXISTS conditions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condition_name TEXT UNIQUE NOT NULL,
  synonyms       TEXT,
  summary        TEXT NOT NULL,
  source_url     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;

-- Anyone can read the conditions for the AI reference
CREATE POLICY "conditions: public read"
  ON conditions FOR SELECT
  USING (true);

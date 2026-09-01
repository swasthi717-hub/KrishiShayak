-- ============================================================
-- Offline Sync Support
-- ============================================================

-- 1. Disease Reports — client UUID + upsert enabled
-- ============================================================
CREATE TABLE IF NOT EXISTS disease_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT disease_reports_id_key UNIQUE (id)
);

-- 2. Soil Reports — version column + conflict protection
-- ============================================================
CREATE TABLE IF NOT EXISTS soil_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ph_level NUMERIC(3, 1),
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT soil_reports_id_key UNIQUE (id)
);

-- 3. Auto-increment version trigger
-- ============================================================
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_soil_reports_version ON soil_reports;
CREATE TRIGGER trg_soil_reports_version
BEFORE UPDATE ON soil_reports
FOR EACH ROW EXECUTE FUNCTION increment_version();

-- 4. RLS — Row Level Security
-- ============================================================
ALTER TABLE disease_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own disease reports" ON disease_reports;
CREATE POLICY "Users can manage their own disease reports"
ON disease_reports FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own soil reports" ON soil_reports;
CREATE POLICY "Users can manage their own soil reports"
ON soil_reports FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Edge Function Idempotency Table (For Gemini/AI Retries)
-- ============================================================
CREATE TABLE IF NOT EXISTS edge_function_requests (
  client_request_id UUID PRIMARY KEY,
  function_name TEXT NOT NULL,
  response_body JSONB,
  status_code INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
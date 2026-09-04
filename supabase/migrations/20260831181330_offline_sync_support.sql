-- ============================================================
-- Offline Sync Support
-- ============================================================

-- 1. Disease Reports — client UUID + upsert enabled
-- ============================================================

CREATE TABLE IF NOT EXISTS public.disease_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT disease_reports_id_key UNIQUE (id)
);

-- 2. Soil Reports — add versioning to EXISTING table
-- ============================================================

ALTER TABLE public.soil_reports
ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

-- 3. Auto-increment version trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_soil_reports_version
ON public.soil_reports;

CREATE TRIGGER trg_soil_reports_version
BEFORE UPDATE ON public.soil_reports
FOR EACH ROW
EXECUTE FUNCTION public.increment_version();

-- 4. RLS — Row Level Security
-- ============================================================

ALTER TABLE public.disease_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own disease reports"
ON public.disease_reports;

CREATE POLICY "Users can manage their own disease reports"
ON public.disease_reports
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own soil reports"
ON public.soil_reports;

CREATE POLICY "Users can manage their own soil reports"
ON public.soil_reports
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.farms
    WHERE farms.id = soil_reports.farm_id
      AND farms.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.farms
    WHERE farms.id = soil_reports.farm_id
      AND farms.user_id = auth.uid()
  )
);

-- 5. Edge Function Idempotency Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.edge_function_requests (
  client_request_id UUID PRIMARY KEY,
  function_name TEXT NOT NULL,
  response_body JSONB,
  status_code INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
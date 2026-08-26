-- KrishiSahayak initial schema
-- Tables: profiles, farms, crops, soil_reports
-- Future modules (not created here): fertilizer_history, fertilizer_recommendations,
-- weather_cache, weather_alerts, market_prices, government_schemes,
-- copilot_conversations, copilot_messages, disease_detections,
-- yield_predictions, notifications, device_tokens, sync_operations

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'hi',
  state TEXT,
  district TEXT,
  village TEXT,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_preferred_language_check
    CHECK (preferred_language IN ('en', 'hi', 'mr', 'bn', 'ta', 'te', 'kn', 'ml', 'gu', 'pa', 'or')),
  CONSTRAINT profiles_latitude_check
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT profiles_longitude_check
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

CREATE TABLE IF NOT EXISTS public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  farm_name TEXT NOT NULL,
  area NUMERIC(12, 4),
  area_unit TEXT NOT NULL DEFAULT 'acre',
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  state TEXT,
  district TEXT,
  village TEXT,
  soil_type TEXT,
  irrigation_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT farms_area_unit_check
    CHECK (area_unit IN ('acre', 'hectare', 'bigha', 'guntha', 'sq_m')),
  CONSTRAINT farms_area_check
    CHECK (area IS NULL OR area >= 0),
  CONSTRAINT farms_latitude_check
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT farms_longitude_check
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

CREATE TABLE IF NOT EXISTS public.crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms (id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  variety TEXT,
  sowing_date DATE,
  expected_harvest_date DATE,
  growth_stage TEXT,
  acreage NUMERIC(12, 4),
  previous_yield NUMERIC(12, 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT crops_acreage_check
    CHECK (acreage IS NULL OR acreage >= 0),
  CONSTRAINT crops_previous_yield_check
    CHECK (previous_yield IS NULL OR previous_yield >= 0),
  CONSTRAINT crops_harvest_after_sowing_check
    CHECK (
      sowing_date IS NULL
      OR expected_harvest_date IS NULL
      OR expected_harvest_date >= sowing_date
    )
);

CREATE TABLE IF NOT EXISTS public.soil_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms (id) ON DELETE CASCADE,
  nitrogen NUMERIC(12, 4),
  phosphorus NUMERIC(12, 4),
  potassium NUMERIC(12, 4),
  ph NUMERIC(4, 2),
  organic_carbon NUMERIC(8, 4),
  soil_type TEXT,
  report_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT soil_reports_ph_check
    CHECK (ph IS NULL OR (ph >= 0 AND ph <= 14))
);

CREATE INDEX IF NOT EXISTS idx_farms_user_id ON public.farms (user_id);
CREATE INDEX IF NOT EXISTS idx_crops_farm_id ON public.crops (farm_id);
CREATE INDEX IF NOT EXISTS idx_soil_reports_farm_id ON public.soil_reports (farm_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles (phone);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_farms_updated_at ON public.farms;
CREATE TRIGGER trg_farms_updated_at
  BEFORE UPDATE ON public.farms
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_crops_updated_at ON public.crops;
CREATE TRIGGER trg_crops_updated_at
  BEFORE UPDATE ON public.crops
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_soil_reports_updated_at ON public.soil_reports;
CREATE TRIGGER trg_soil_reports_updated_at
  BEFORE UPDATE ON public.soil_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, phone, preferred_language)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_language', ''), 'hi')
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "farms_select_own" ON public.farms;
CREATE POLICY "farms_select_own"
  ON public.farms
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "farms_insert_own" ON public.farms;
CREATE POLICY "farms_insert_own"
  ON public.farms
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "farms_update_own" ON public.farms;
CREATE POLICY "farms_update_own"
  ON public.farms
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "farms_delete_own" ON public.farms;
CREATE POLICY "farms_delete_own"
  ON public.farms
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "crops_select_own" ON public.crops;
CREATE POLICY "crops_select_own"
  ON public.crops
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.farms
      WHERE farms.id = crops.farm_id
        AND farms.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "crops_insert_own" ON public.crops;
CREATE POLICY "crops_insert_own"
  ON public.crops
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.farms
      WHERE farms.id = crops.farm_id
        AND farms.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "crops_update_own" ON public.crops;
CREATE POLICY "crops_update_own"
  ON public.crops
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.farms
      WHERE farms.id = crops.farm_id
        AND farms.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.farms
      WHERE farms.id = crops.farm_id
        AND farms.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "crops_delete_own" ON public.crops;
CREATE POLICY "crops_delete_own"
  ON public.crops
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.farms
      WHERE farms.id = crops.farm_id
        AND farms.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "soil_reports_select_own" ON public.soil_reports;
CREATE POLICY "soil_reports_select_own"
  ON public.soil_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.farms
      WHERE farms.id = soil_reports.farm_id
        AND farms.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "soil_reports_insert_own" ON public.soil_reports;
CREATE POLICY "soil_reports_insert_own"
  ON public.soil_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.farms
      WHERE farms.id = soil_reports.farm_id
        AND farms.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "soil_reports_update_own" ON public.soil_reports;
CREATE POLICY "soil_reports_update_own"
  ON public.soil_reports
  FOR UPDATE
  TO authenticated
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

DROP POLICY IF EXISTS "soil_reports_delete_own" ON public.soil_reports;
CREATE POLICY "soil_reports_delete_own"
  ON public.soil_reports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.farms
      WHERE farms.id = soil_reports.farm_id
        AND farms.user_id = auth.uid()
    )
  );

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crops TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.soil_reports TO authenticated;

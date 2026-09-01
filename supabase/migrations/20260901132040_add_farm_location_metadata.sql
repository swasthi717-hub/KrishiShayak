-- ============================================================
-- Farmer GPS Location Support
-- ============================================================

-- The farms table already contains latitude and longitude.
-- This migration adds metadata so we know when the location
-- was obtained and how it was obtained.

ALTER TABLE public.farms
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;

ALTER TABLE public.farms
ADD COLUMN IF NOT EXISTS location_source TEXT;

ALTER TABLE public.farms
ADD COLUMN IF NOT EXISTS location_accuracy_meters NUMERIC(10,2);

-- Allowed sources for farm location.
ALTER TABLE public.farms
ADD CONSTRAINT farms_location_source_check
CHECK (
  location_source IS NULL
  OR location_source IN ('gps', 'manual', 'unknown')
);

-- Accuracy cannot be negative.
ALTER TABLE public.farms
ADD CONSTRAINT farms_location_accuracy_check
CHECK (
  location_accuracy_meters IS NULL
  OR location_accuracy_meters >= 0
);

-- Index for location-related queries later.
CREATE INDEX IF NOT EXISTS idx_farms_location
ON public.farms (latitude, longitude);
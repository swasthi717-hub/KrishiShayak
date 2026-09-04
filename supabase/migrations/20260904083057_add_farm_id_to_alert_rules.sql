-- ============================================================
-- Link alert_rules to farms, instead of duplicating location data.
--
-- farms already has latitude, longitude, state, district (added by
-- the GPS work). evaluate-alerts needs these to call the weather/mandi
-- APIs, so rather than storing a second copy of the same data on
-- alert_rules (which would go stale the moment a farm's location is
-- updated), alert_rules just references the farm it's about.
--
-- Mandi's "commodity" is just alert_rules.crop_name, already present
-- — no new column needed for that one.
-- ============================================================

ALTER TABLE public.alert_rules
ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_alert_rules_farm_id ON public.alert_rules (farm_id);
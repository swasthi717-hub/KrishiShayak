-- ============================================================
-- Smart Alerts & Push Notifications Support
-- ============================================================

-- 1. Device Tokens Table (FCM Tokens for Push Notifications)
-- ============================================================
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('web', 'android', 'ios')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, fcm_token)
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens (user_id);

-- 2. Notification Preferences Table
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  weather_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  pest_disease_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  market_price_updates BOOLEAN NOT NULL DEFAULT TRUE,
  yield_risk_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Notifications Table (Deduplication Enforced)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('weather','pest_disease','market','yield_risk','system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warn','urgent')),
  data JSONB,
  dedupe_key TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, dedupe_key)
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, is_read);

-- 4. Alert Rules Table (Trigger Conditions) — ADDED, was not in original files
-- ============================================================
-- Confirm this design with your team before merging: it defines the
-- *conditions* under which a notification should be generated
-- (e.g. weather threshold, pest risk score), separate from the
-- notifications table above which just stores/tracks sent alerts.
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('weather','pest_disease','market','yield_risk')),
  crop_name TEXT,
  metric TEXT NOT NULL,              -- e.g. 'rainfall_mm', 'temperature_c', 'price_per_quintal'
  operator TEXT NOT NULL CHECK (operator IN ('>', '<', '>=', '<=', '=')),
  threshold NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alert_rules_user_id ON alert_rules (user_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules (is_active) WHERE is_active = TRUE;

-- 5. Auto-touch updated_at on notification_preferences and alert_rules
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notification_preferences_set_updated_at ON notification_preferences;
CREATE TRIGGER notification_preferences_set_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS alert_rules_set_updated_at ON alert_rules;
CREATE TRIGGER alert_rules_set_updated_at
  BEFORE UPDATE ON alert_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6. Row Level Security (RLS) & Policies
-- ============================================================
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "device_tokens_owner_all" ON device_tokens;
CREATE POLICY "device_tokens_owner_all" ON device_tokens
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_preferences_owner_all" ON notification_preferences;
CREATE POLICY "notification_preferences_owner_all" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_owner_all" ON notifications;
CREATE POLICY "notifications_owner_all" ON notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "alert_rules_owner_all" ON alert_rules;
CREATE POLICY "alert_rules_owner_all" ON alert_rules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
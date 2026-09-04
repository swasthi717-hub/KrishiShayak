-- ============================================================
-- Re-apply notification_preferences creation on signup.
--
-- Context: feature/farmer-gps's 20260903065647_fix_profile_trigger.sql
-- redefines handle_new_user() (to fix a separate signup bug) using a
-- version that does NOT insert a notification_preferences row. Since
-- migrations apply in timestamp order, that migration runs after this
-- branch's original notification_preferences fix and silently undoes
-- it. This migration re-adds it on top of farmer-gps's (correct,
-- signup-fixing) version of the function, so both fixes are preserved.
--
-- Without this: every new signup has NO notification_preferences row,
-- and the alert engine (evaluate-alerts) checks preferences before
-- sending any push — so with no row, every alert gets silently
-- skipped for every new user, forever.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    name,
    phone,
    preferred_language
  )
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'preferred_language', ''),
      'hi'
    )
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill: anyone who signed up in the window between the two
-- migrations (or before either existed) still gets a preferences row.
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
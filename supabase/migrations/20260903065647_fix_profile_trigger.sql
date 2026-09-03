-- ============================================================
-- Fix profile creation for Supabase Auth users
-- ============================================================

-- ------------------------------------------------------------
-- 1. Create/update the profile trigger function
-- ------------------------------------------------------------

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

  RETURN NEW;
END;
$$;


-- ------------------------------------------------------------
-- 2. Create trigger for future users
-- ------------------------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- ------------------------------------------------------------
-- 3. Create profiles for existing Auth users
--    who don't already have a profile
-- ------------------------------------------------------------

INSERT INTO public.profiles (
  user_id,
  name,
  phone,
  preferred_language
)
SELECT
  u.id,
  NULLIF(u.raw_user_meta_data->>'name', ''),
  NULLIF(u.raw_user_meta_data->>'phone', ''),
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'preferred_language', ''),
    'hi'
  )
FROM auth.users u
LEFT JOIN public.profiles p
  ON p.user_id = u.id
WHERE p.user_id IS NULL;
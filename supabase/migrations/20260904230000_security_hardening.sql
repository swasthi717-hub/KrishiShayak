-- ============================================================
-- KrishiSahayak Security Hardening
-- ============================================================

-- 1. Remove unnecessary anonymous access to application tables.
-- Users should authenticate before accessing farmer data.

REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.farms FROM anon;
REVOKE ALL ON TABLE public.crops FROM anon;
REVOKE ALL ON TABLE public.soil_reports FROM anon;


-- 2. Remove direct execution privileges from client roles
-- for internal trigger functions.
--
-- These functions are used by database triggers and are not
-- intended to be called directly from the frontend.

REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM authenticated;


-- 3. Explicitly keep application tables available to
-- authenticated users.
--
-- RLS policies remain responsible for deciding WHICH rows
-- the authenticated user can access.

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.profiles
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.farms
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.crops
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.soil_reports
TO authenticated;



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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

    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."crops" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "farm_id" "uuid" NOT NULL,
    "crop_name" "text" NOT NULL,
    "variety" "text",
    "sowing_date" "date",
    "expected_harvest_date" "date",
    "growth_stage" "text",
    "acreage" numeric(12,4),
    "previous_yield" numeric(12,4),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crops_acreage_check" CHECK ((("acreage" IS NULL) OR ("acreage" >= (0)::numeric))),
    CONSTRAINT "crops_harvest_after_sowing_check" CHECK ((("sowing_date" IS NULL) OR ("expected_harvest_date" IS NULL) OR ("expected_harvest_date" >= "sowing_date"))),
    CONSTRAINT "crops_previous_yield_check" CHECK ((("previous_yield" IS NULL) OR ("previous_yield" >= (0)::numeric)))
);


ALTER TABLE "public"."crops" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."farms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "farm_name" "text" NOT NULL,
    "area" numeric(12,4),
    "area_unit" "text" DEFAULT 'acre'::"text" NOT NULL,
    "latitude" numeric(9,6),
    "longitude" numeric(9,6),
    "state" "text",
    "district" "text",
    "village" "text",
    "soil_type" "text",
    "irrigation_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "farms_area_check" CHECK ((("area" IS NULL) OR ("area" >= (0)::numeric))),
    CONSTRAINT "farms_area_unit_check" CHECK (("area_unit" = ANY (ARRAY['acre'::"text", 'hectare'::"text", 'bigha'::"text", 'guntha'::"text", 'sq_m'::"text"]))),
    CONSTRAINT "farms_latitude_check" CHECK ((("latitude" IS NULL) OR (("latitude" >= ('-90'::integer)::numeric) AND ("latitude" <= (90)::numeric)))),
    CONSTRAINT "farms_longitude_check" CHECK ((("longitude" IS NULL) OR (("longitude" >= ('-180'::integer)::numeric) AND ("longitude" <= (180)::numeric))))
);


ALTER TABLE "public"."farms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "user_id" "uuid" NOT NULL,
    "name" "text",
    "phone" "text",
    "preferred_language" "text" DEFAULT 'hi'::"text" NOT NULL,
    "state" "text",
    "district" "text",
    "village" "text",
    "latitude" numeric(9,6),
    "longitude" numeric(9,6),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_latitude_check" CHECK ((("latitude" IS NULL) OR (("latitude" >= ('-90'::integer)::numeric) AND ("latitude" <= (90)::numeric)))),
    CONSTRAINT "profiles_longitude_check" CHECK ((("longitude" IS NULL) OR (("longitude" >= ('-180'::integer)::numeric) AND ("longitude" <= (180)::numeric)))),
    CONSTRAINT "profiles_preferred_language_check" CHECK (("preferred_language" = ANY (ARRAY['en'::"text", 'hi'::"text", 'mr'::"text", 'bn'::"text", 'ta'::"text", 'te'::"text", 'kn'::"text", 'ml'::"text", 'gu'::"text", 'pa'::"text", 'or'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."soil_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "farm_id" "uuid" NOT NULL,
    "nitrogen" numeric(12,4),
    "phosphorus" numeric(12,4),
    "potassium" numeric(12,4),
    "ph" numeric(4,2),
    "organic_carbon" numeric(8,4),
    "soil_type" "text",
    "report_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "soil_reports_ph_check" CHECK ((("ph" IS NULL) OR (("ph" >= (0)::numeric) AND ("ph" <= (14)::numeric))))
);


ALTER TABLE "public"."soil_reports" OWNER TO "postgres";


ALTER TABLE ONLY "public"."crops"
    ADD CONSTRAINT "crops_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."farms"
    ADD CONSTRAINT "farms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."soil_reports"
    ADD CONSTRAINT "soil_reports_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_crops_farm_id" ON "public"."crops" USING "btree" ("farm_id");



CREATE INDEX "idx_farms_user_id" ON "public"."farms" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_phone" ON "public"."profiles" USING "btree" ("phone");



CREATE INDEX "idx_soil_reports_farm_id" ON "public"."soil_reports" USING "btree" ("farm_id");



CREATE OR REPLACE TRIGGER "trg_crops_updated_at" BEFORE UPDATE ON "public"."crops" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_farms_updated_at" BEFORE UPDATE ON "public"."farms" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_soil_reports_updated_at" BEFORE UPDATE ON "public"."soil_reports" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."crops"
    ADD CONSTRAINT "crops_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."farms"
    ADD CONSTRAINT "farms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."soil_reports"
    ADD CONSTRAINT "soil_reports_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE CASCADE;



ALTER TABLE "public"."crops" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crops_delete_own" ON "public"."crops" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."farms"
  WHERE (("farms"."id" = "crops"."farm_id") AND ("farms"."user_id" = "auth"."uid"())))));



CREATE POLICY "crops_insert_own" ON "public"."crops" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."farms"
  WHERE (("farms"."id" = "crops"."farm_id") AND ("farms"."user_id" = "auth"."uid"())))));



CREATE POLICY "crops_select_own" ON "public"."crops" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."farms"
  WHERE (("farms"."id" = "crops"."farm_id") AND ("farms"."user_id" = "auth"."uid"())))));



CREATE POLICY "crops_update_own" ON "public"."crops" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."farms"
  WHERE (("farms"."id" = "crops"."farm_id") AND ("farms"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."farms"
  WHERE (("farms"."id" = "crops"."farm_id") AND ("farms"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."farms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "farms_delete_own" ON "public"."farms" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "farms_insert_own" ON "public"."farms" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "farms_select_own" ON "public"."farms" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "farms_update_own" ON "public"."farms" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."soil_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "soil_reports_delete_own" ON "public"."soil_reports" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."farms"
  WHERE (("farms"."id" = "soil_reports"."farm_id") AND ("farms"."user_id" = "auth"."uid"())))));



CREATE POLICY "soil_reports_insert_own" ON "public"."soil_reports" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."farms"
  WHERE (("farms"."id" = "soil_reports"."farm_id") AND ("farms"."user_id" = "auth"."uid"())))));



CREATE POLICY "soil_reports_select_own" ON "public"."soil_reports" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."farms"
  WHERE (("farms"."id" = "soil_reports"."farm_id") AND ("farms"."user_id" = "auth"."uid"())))));



CREATE POLICY "soil_reports_update_own" ON "public"."soil_reports" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."farms"
  WHERE (("farms"."id" = "soil_reports"."farm_id") AND ("farms"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."farms"
  WHERE (("farms"."id" = "soil_reports"."farm_id") AND ("farms"."user_id" = "auth"."uid"())))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."crops" TO "anon";
GRANT ALL ON TABLE "public"."crops" TO "authenticated";
GRANT ALL ON TABLE "public"."crops" TO "service_role";



GRANT ALL ON TABLE "public"."farms" TO "anon";
GRANT ALL ON TABLE "public"."farms" TO "authenticated";
GRANT ALL ON TABLE "public"."farms" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."soil_reports" TO "anon";
GRANT ALL ON TABLE "public"."soil_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."soil_reports" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































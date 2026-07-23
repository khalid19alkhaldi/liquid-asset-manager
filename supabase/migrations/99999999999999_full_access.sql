
-- ============ THE MASTER RESET SCRIPT (V4 - FINAL FIX) ============

-- 1. CLEAN UP PREVIOUS REVOKED PERMISSIONS
-- This ensures that even if previous migrations revoked rights, we grant them back.
GRANT ALL ON SCHEMA public TO postgres, service_role, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, authenticated, anon;

-- 2. ENSURE TYPES AND TABLES EXIST
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'facility_manager', 'technician');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. RESET ALL POLICIES TO "FULL ACCESS"
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        -- Wipe every possible existing policy to avoid "Hosa"
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public') LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
        END LOOP;

        -- Create the simplest "True" policy for everyone logged in
        EXECUTE format('CREATE POLICY "Master_Full_Access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);

        -- Special permission for Signup (Let anon users see buildings)
        IF t = 'buildings' THEN
            EXECUTE format('CREATE POLICY "Master_Anon_Read_Buildings" ON public.%I FOR SELECT TO anon USING (true)', t);
        END IF;

        -- Ensure RLS is on
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- 4. THE AUTO-CONFIRM & AUTO-ADMIN TRIGGER
-- This function handles EVERYTHING when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- 1. Create Profile
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

  -- 2. Assign Admin Role (For "Full Access" experience)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT DO NOTHING;

  -- 3. Auto-Confirm Email (Optional but helpful if done via SQL)
  -- Note: auth.users updates from triggers can be tricky, so we'll also do a batch update below.

  RETURN NEW;
END; $$;

-- Re-link trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. EMERGENCY REPAIR FOR CURRENT USERS
-- Confirm all emails and make everyone admin
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
ON CONFLICT DO NOTHING;

-- 6. GRANT EXECUTE BACK ON FUNCTIONS
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

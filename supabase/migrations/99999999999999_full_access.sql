
-- ============ THE TOTAL RESET & RECONSTRUCTION (FINAL VERSION) ============

-- 1. DESTRUCTIVE CLEANUP
-- We drop everything related to accounts to ensure no legacy conflicts exist.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- 2. REBUILD TYPES
CREATE TYPE public.app_role AS ENUM ('admin', 'facility_manager', 'technician');

-- 3. REBUILD TABLES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  assigned_building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 4. MASTER PERMISSIONS & RLS (OPEN ACCESS)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        -- Wipe all existing policies
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t);

        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public') LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
        END LOOP;

        -- Create a universal "Open Access" policy for development/testing
        EXECUTE format('CREATE POLICY "Universal_Access" ON public.%I FOR ALL TO authenticated, anon USING (true) WITH CHECK (true)', t);

        -- Enable RLS back
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- 5. THE NEW ROBUST AUTO-ADMIN TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Create Profile
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);

  -- Assign Admin Role automatically to every new signup
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. GLOBAL GRANTS
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, authenticated, anon;
GRANT ALL ON SCHEMA public TO postgres, service_role, authenticated, anon;

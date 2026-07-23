
-- ============ THE TOTAL AUTH REMOVAL ============

-- 1. DESTRUCTIVE CLEANUP (Removes all Auth-related tables and logic)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- 2. MODIFY EXISTING TABLES (Make them independent of auth.users)
ALTER TABLE public.maintenance_requests ALTER COLUMN reported_by DROP NOT NULL;
ALTER TABLE public.maintenance_requests ALTER COLUMN reported_by TYPE TEXT USING reported_by::text;
COMMENT ON COLUMN public.maintenance_requests.reported_by IS 'Now stores a name or label instead of a UUID';

-- 3. MASTER PERMISSIONS & RLS (OPEN ACCESS FOR ANON)
DO $$
DECLARE
    t_name text;
    r_pol RECORD;
BEGIN
    FOR t_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        -- Disable and Re-enable to reset
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t_name);

        -- Drop ALL existing policies
        FOR r_pol IN (SELECT policyname FROM pg_policies WHERE tablename = t_name AND schemaname = 'public') LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r_pol.policyname, t_name);
        END LOOP;

        -- Create a single Universal policy for EVERYONE (anon and authenticated)
        EXECUTE format('CREATE POLICY "Universal_Open_Access" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t_name);

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);
    END LOOP;
END $$;

-- 4. GLOBAL GRANTS TO ANON
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON SCHEMA public TO anon, authenticated, postgres, service_role;

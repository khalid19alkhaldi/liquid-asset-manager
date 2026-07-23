
-- ============ FULL ACCESS PERMISSIONS ============

-- Grant access to all authenticated users for all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        -- Drop existing restrictive policies for authenticated role to avoid conflicts
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated read buildings" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated read facilities" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated read prices" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users read own profile or admin reads all" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users see own roles" ON public.%I', t);

        -- Create a new full access policy
        EXECUTE format('CREATE POLICY "Full access for authenticated users" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

-- Restore execution rights for functions that were revoked
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_building(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated;

-- Ensure authenticated role has basic DML permissions on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

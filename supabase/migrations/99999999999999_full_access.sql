
-- ============ THE ULTIMATE FULL ACCESS & REPAIR SCRIPT ============

-- 1. Ensure the custom type exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'facility_manager', 'technician');
    END IF;
END $$;

-- 2. Ensure user_roles table exists (in case it wasn't created)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Grant access to all authenticated users for all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        -- Drop existing restrictive policies
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated read buildings" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated read facilities" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated read prices" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users read own profile or admin reads all" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users see own roles" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Full access for authenticated users" ON public.%I', t);

        -- Create a new full access policy for authenticated users
        EXECUTE format('CREATE POLICY "Full access for authenticated users" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);

        -- Allow anonymous users to READ buildings so they can see the list during signup
        IF t = 'buildings' THEN
            EXECUTE format('CREATE POLICY "Allow anon read buildings" ON public.%I FOR SELECT TO anon USING (true)', t);
        END IF;

        -- Enable RLS just in case
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- 4. Assign ADMIN role to ALL current users and CONFIRM their emails
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Update the signup trigger to assign ADMIN role to future users automatically
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- Assign Admin role automatically
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END; $$;

-- 6. Restore execution rights and general permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;
GRANT ALL ON SCHEMA public TO authenticated, anon;

-- Ensure the specific function exists before granting
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
        GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
    END IF;
END $$;

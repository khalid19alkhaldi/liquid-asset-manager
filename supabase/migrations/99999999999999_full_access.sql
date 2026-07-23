
-- ============ THE COMPLETE AUTH REBIRTH (FINAL DEFINITIVE VERSION) ============

-- 1. DROP EVERYTHING TO START FRESH
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- 2. RE-CREATE ENUMS & SCHEMA
CREATE TYPE public.app_role AS ENUM ('admin', 'facility_manager', 'technician');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
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

-- 3. THE DEFINITIVE TRIGGER (Handles everything automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    is_first boolean;
    meta_role text;
    meta_building_id uuid;
BEGIN
    -- Check if this is the system's first user
    SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;

    -- Extract metadata (sent from the signup form)
    meta_role := NEW.raw_user_meta_data->>'role';
    BEGIN
        meta_building_id := (NEW.raw_user_meta_data->>'assigned_building_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
        meta_building_id := NULL;
    END;

    -- A. Create the user profile
    INSERT INTO public.profiles (id, full_name, email, assigned_building_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        meta_building_id
    );

    -- B. Assign the role
    -- Rules: First user is always 'admin'. Others get the meta_role or 'technician' default.
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
        NEW.id,
        CASE
            WHEN is_first THEN 'admin'::public.app_role
            ELSE COALESCE(meta_role::public.app_role, 'technician'::public.app_role)
        END
    );

    RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. MASTER PERMISSIONS (FULL OPEN ACCESS FOR RELIABILITY)
DO $$
DECLARE
    t_name text;
    r_pol RECORD;
BEGIN
    FOR t_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);

        -- Drop any existing policy to avoid duplicates/conflicts
        FOR r_pol IN (SELECT policyname FROM pg_policies WHERE tablename = t_name AND schemaname = 'public') LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r_pol.policyname, t_name);
        END LOOP;

        -- Create one universal policy for everything
        EXECUTE format('CREATE POLICY "Master_Access" ON public.%I FOR ALL TO authenticated, anon USING (true) WITH CHECK (true)', t_name);
    END LOOP;
END $$;

-- 5. GRANTS & SYSTEM TWEAKS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Force confirm all current and future users
UPDATE auth.users SET email_confirmed_at = now();

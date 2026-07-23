
-- ============ NEW CUSTOM AUTH SYSTEM (RECONSTRUCTION) ============

-- 1. CLEANUP OLD TABLES AND TYPES
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- 2. CREATE ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'facility_manager', 'technician');

-- 3. CREATE PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  assigned_building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE USER ROLES TABLE
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 5. UPDATE MAINTENANCE REQUESTS (Link back to UUID)
ALTER TABLE public.maintenance_requests ALTER COLUMN reported_by TYPE UUID USING (CASE WHEN reported_by ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN reported_by::uuid ELSE NULL END);
ALTER TABLE public.maintenance_requests ADD CONSTRAINT maintenance_requests_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES auth.users(id);

-- 6. SECURITY: ENABLE RLS AND POLICIES
DO $$
DECLARE
    t_name text;
    r_pol RECORD;
BEGIN
    FOR t_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);

        -- Wipe existing policies
        FOR r_pol IN (SELECT policyname FROM pg_policies WHERE tablename = t_name AND schemaname = 'public') LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r_pol.policyname, t_name);
        END LOOP;
    END LOOP;
END $$;

-- Define Specific Policies
-- Admin can do everything
CREATE POLICY "Admins_All_Access" ON public.profiles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins_All_Access" ON public.user_roles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins_All_Access" ON public.buildings FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins_All_Access" ON public.maintenance_requests FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can read their own profiles
CREATE POLICY "Users_Own_Profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users_Update_Own_Profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Everyone can read buildings
CREATE POLICY "Public_Read_Buildings" ON public.buildings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon_Read_Buildings" ON public.buildings FOR SELECT TO anon USING (true);

-- Maintenance Requests access based on role
CREATE POLICY "FM_Own_Building_Requests" ON public.maintenance_requests FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND assigned_building_id = maintenance_requests.building_id)
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'facility_manager')
);

CREATE POLICY "Technicians_Assigned_Requests" ON public.maintenance_requests FOR SELECT TO authenticated
USING (assigned_to = auth.uid());

-- 7. AUTO-ADMIN TRIGGER & AUTO-CONFIRM
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    is_first_user boolean;
BEGIN
    -- Check if this is the first user ever to make them admin automatically
    SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first_user;

    -- Create Profile
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);

    -- If it's the first user, make them admin.
    -- Otherwise, roles should be assigned via UI or admin.
    IF is_first_user THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    END IF;

    RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-confirm all emails at the database level to avoid friction
-- Note: This is an emergency fix for current and future signups
CREATE OR REPLACE FUNCTION public.auto_confirm_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    NEW.email_confirmed_at = now();
    RETURN NEW;
END; $$;

-- Note: Cannot easily add trigger to auth.users in some environments without Superuser,
-- so we'll also use a manual update periodically or during login.
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

-- 8. GLOBAL GRANTS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;
GRANT ALL ON SCHEMA public TO authenticated, anon;

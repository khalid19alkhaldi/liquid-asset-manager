
-- ============ THE FINAL ROBUST AUTH TRIGGER (V7) ============

-- 1. DESTRUCTIVE CLEANUP (Ensures we start clean)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. THE SMART TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    is_first boolean;
    chosen_role public.app_role;
    chosen_building_id uuid;
BEGIN
    -- Check if this is the first user ever
    SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;

    -- Extract data from metadata sent from frontend
    chosen_role := (NEW.raw_user_meta_data->>'role')::public.app_role;
    chosen_building_id := (NEW.raw_user_meta_data->>'assigned_building_id')::uuid;

    -- 1. Create Profile
    INSERT INTO public.profiles (id, full_name, email, assigned_building_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        chosen_building_id
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        assigned_building_id = COALESCE(profiles.assigned_building_id, EXCLUDED.assigned_building_id);

    -- 2. Assign Role
    -- If first user, force 'admin'. Otherwise, use chosen role or default to 'technician'.
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
        NEW.id,
        CASE WHEN is_first THEN 'admin'::public.app_role ELSE COALESCE(chosen_role, 'technician'::public.app_role) END
    ) ON CONFLICT DO NOTHING;

    RETURN NEW;
END; $$;

-- 3. RE-ENABLE TRIGGER
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. EMERGENCY FIX FOR EXISTING USERS
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

-- Ensure every existing user has a role (Admin by default for current mess cleanup)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
ON CONFLICT DO NOTHING;

-- 5. RE-GRANT ALL PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;
GRANT ALL ON SCHEMA public TO authenticated, anon;

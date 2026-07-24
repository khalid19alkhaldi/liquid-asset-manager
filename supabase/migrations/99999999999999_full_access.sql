
-- ============ THE COMPLETE SYSTEM REBIRTH (FINAL MASTER DATA) ============

-- 1. DESTRUCTIVE CLEANUP (Ensures no legacy conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.maintenance_requests CASCADE;
DROP TABLE IF EXISTS public.facilities CASCADE;
DROP TABLE IF EXISTS public.price_catalog CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.buildings CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.building_type CASCADE;
DROP TYPE IF EXISTS public.facility_category CASCADE;
DROP TYPE IF EXISTS public.request_status CASCADE;
DROP TYPE IF EXISTS public.priority_level CASCADE;

-- 2. CREATE CUSTOM TYPES
CREATE TYPE public.app_role AS ENUM ('admin', 'facility_manager', 'technician');
CREATE TYPE public.building_type AS ENUM ('main_admin', 'school', 'residential', 'warehouse', 'branch_office');
CREATE TYPE public.facility_category AS ENUM ('interior', 'exterior');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'in_progress', 'completed', 'rejected');
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- 3. CREATE CORE TABLES
CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.building_type NOT NULL,
  location TEXT,
  annual_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.price_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_type TEXT NOT NULL UNIQUE,
  service_name TEXT NOT NULL,
  standard_price NUMERIC(10,2) NOT NULL,
  unit TEXT DEFAULT 'per_service',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category public.facility_category NOT NULL,
  facility_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  priority public.priority_level NOT NULL DEFAULT 'medium',
  estimated_cost NUMERIC(10,2) DEFAULT 0,
  actual_cost NUMERIC(10,2),
  admin_notes TEXT,
  technician_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.5 AUDIT LOG SYSTEM
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  performer_name TEXT,
  action_type TEXT NOT NULL, -- e.g., 'UPDATE_PRICE', 'APPROVE_REQUEST'
  entity_type TEXT NOT NULL, -- e.g., 'price_catalog', 'maintenance_requests'
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to handle automated logging
CREATE OR REPLACE FUNCTION public.log_operation()
RETURNS TRIGGER AS $$
DECLARE
    v_performer_id UUID;
    v_performer_name TEXT;
BEGIN
    v_performer_id := auth.uid();
    SELECT full_name INTO v_performer_name FROM public.profiles WHERE id = v_performer_id;

    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (
            performer_id, performer_name, action_type, entity_type, entity_id, old_values, new_values
        ) VALUES (
            v_performer_id,
            v_performer_name,
            'UPDATE',
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to target tables
CREATE TRIGGER trg_audit_requests AFTER UPDATE ON public.maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION public.log_operation();

CREATE TRIGGER trg_audit_prices AFTER UPDATE ON public.price_catalog
    FOR EACH ROW EXECUTE FUNCTION public.log_operation();

-- 4. MASTER PERMISSIONS & RLS (OPEN FOR RELIABILITY)
DO $$
DECLARE
    t_name text;
    r_pol RECORD;
BEGIN
    FOR t_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);
        FOR r_pol IN (SELECT policyname FROM pg_policies WHERE tablename = t_name AND schemaname = 'public') LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r_pol.policyname, t_name);
        END LOOP;
        EXECUTE format('CREATE POLICY "Universal_Master_Access" ON public.%I FOR ALL TO authenticated, anon USING (true) WITH CHECK (true)', t_name);
    END LOOP;
END $$;

-- 5. THE SMART AUTH TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    is_first boolean;
    meta_role text;
    meta_building_id uuid;
BEGIN
    -- Auto-confirm email
    UPDATE auth.users SET email_confirmed_at = now() WHERE id = NEW.id;

    SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;
    meta_role := NEW.raw_user_meta_data->>'role';
    BEGIN meta_building_id := (NEW.raw_user_meta_data->>'assigned_building_id')::uuid; EXCEPTION WHEN OTHERS THEN meta_building_id := NULL; END;

    INSERT INTO public.profiles (id, full_name, email, assigned_building_id)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, meta_building_id);

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, CASE WHEN is_first THEN 'admin'::public.app_role ELSE COALESCE(meta_role::public.app_role, 'technician'::public.app_role) END);

    RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. SEED DATA (THE DATA LIFEBLOOD)
INSERT INTO public.buildings (name, type, location, annual_budget) VALUES
  ('مبنى الإدارة الرئيسي', 'main_admin', 'الجبيل - المقر الرئيسي', 250000),
  ('مدرسة الجبيل الأهلية', 'school', 'حي الفناتير', 180000),
  ('عمارة الأوقاف السكنية', 'residential', 'حي الدفي', 150000),
  ('المستودع المركزي', 'warehouse', 'المنطقة الصناعية', 90000),
  ('المكاتب الإشرافية الفرعية', 'branch_office', 'وسط المدينة', 75000);

INSERT INTO public.price_catalog (facility_type, service_name, standard_price) VALUES
  ('ac_maintenance', 'صيانة مكيّف', 150),
  ('elevator_maintenance', 'صيانة مصعد', 500),
  ('garden_trimming', 'تقليم وتنسيق حدائق', 300),
  ('electrical_repair', 'إصلاح أعطال كهربائية', 200),
  ('lighting_replacement', 'استبدال إنارة', 80),
  ('parking_maintenance', 'صيانة مواقف ومظلات', 400),
  ('fence_gate_repair', 'صيانة أسوار وبوابات', 350),
  ('facade_cleaning', 'تنظيف واجهات', 600),
  ('furniture_repair', 'إصلاح أثاث مكتبي/مدرسي', 120),
  ('door_smart_system', 'صيانة أبواب وأنظمة ذكية', 250),
  ('hvac_ventilation', 'صيانة تهوية', 220),
  ('fire_safety', 'فحص أنظمة سلامة وإطفاء', 450);

-- Automagically link all facilities to every building to ensure dropdowns work
DO $$
DECLARE b RECORD;
BEGIN
  FOR b IN SELECT id FROM public.buildings LOOP
    INSERT INTO public.facilities (building_id, name, category, facility_type) VALUES
      (b.id, 'نظام التكييف والتهوية', 'interior', 'ac_maintenance'),
      (b.id, 'المصاعد الكهربائية', 'interior', 'elevator_maintenance'),
      (b.id, 'الشبكة الكهربائية والإنارة', 'interior', 'electrical_repair'),
      (b.id, 'أنظمة السلامة والإطفاء', 'interior', 'fire_safety'),
      (b.id, 'الأثاث المكتبي والمدرسي', 'interior', 'furniture_repair'),
      (b.id, 'الحدائق والمسطحات', 'exterior', 'garden_trimming'),
      (b.id, 'الواجهات الخارجية', 'exterior', 'facade_cleaning'),
      (b.id, 'مواقف السيارات والمظلات', 'exterior', 'parking_maintenance');
  END LOOP;
END $$;

-- 7. REPAIR CURRENT USERS (Confirm everyone is an Admin/Profile exist)
INSERT INTO public.profiles (id, full_name, email)
SELECT id, email, email FROM auth.users ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users ON CONFLICT DO NOTHING;

UPDATE auth.users SET email_confirmed_at = now();

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

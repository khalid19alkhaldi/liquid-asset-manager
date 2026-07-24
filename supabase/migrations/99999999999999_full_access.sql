
-- ============ SHQ JUBAIL TOTAL REBUILD (MASTER SCHEMA) ============

-- 1. DESTRUCTIVE CLEANUP
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.request_media CASCADE;
DROP TABLE IF EXISTS public.preventive_maintenance CASCADE;
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
CREATE TYPE public.app_role AS ENUM ('admin', 'facility_manager', 'technician', 'contractor');
CREATE TYPE public.building_type AS ENUM ('main_admin', 'school', 'residential', 'warehouse', 'branch_office', 'mosque');
CREATE TYPE public.facility_category AS ENUM ('interior', 'exterior');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'assigned', 'in_progress', 'completed', 'verified', 'rejected');
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- 3. CORE INFRASTRUCTURE
CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.building_type NOT NULL,
  location TEXT,
  annual_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT, -- For contractors
  assigned_building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  rating NUMERIC(2,1) DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE public.price_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_type TEXT NOT NULL UNIQUE,
  service_name TEXT NOT NULL,
  standard_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category public.facility_category NOT NULL,
  facility_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. OPERATIONS & DOCUMENTATION
CREATE TABLE public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id), -- Can be technician or contractor
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  priority public.priority_level NOT NULL DEFAULT 'medium',
  estimated_cost NUMERIC(10,2) DEFAULT 0,
  actual_cost NUMERIC(10,2),
  technician_notes TEXT,
  admin_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.request_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type TEXT NOT NULL, -- 'before', 'after', 'invoice_attachment'
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending_payment', -- 'pending_payment', 'paid', 'rejected'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.preventive_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  frequency_days INTEGER NOT NULL DEFAULT 30,
  last_executed_at TIMESTAMPTZ,
  next_due_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. AUDIT SYSTEM
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performer_id UUID REFERENCES public.profiles(id),
  performer_name TEXT,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. PERMISSIONS & RLS (OPEN FOR DEVELOPMENT)
DO $$
DECLARE t_name text;
BEGIN
    FOR t_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);
        EXECUTE format('CREATE POLICY "Master_Policy" ON public.%I FOR ALL TO authenticated, anon USING (true) WITH CHECK (true)', t_name);
    END LOOP;
END $$;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, authenticated, anon;

-- 7. THE REBORN TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    is_first boolean;
BEGIN
    SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;
    INSERT INTO public.profiles (id, full_name, email, company_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, NEW.raw_user_meta_data->>'company_name');
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, CASE WHEN is_first THEN 'admin'::public.app_role ELSE COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'technician'::public.app_role) END);
    RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. INITIAL SEED
INSERT INTO public.buildings (name, type, location, annual_budget) VALUES
  ('مبنى الإدارة الرئيسي', 'main_admin', 'الجبيل - المقر الرئيسي', 500000),
  ('مدرسة الجبيل الأهلية', 'school', 'حي الفناتير', 350000),
  ('جامع الفاروق', 'mosque', 'حي الدفي', 120000),
  ('عمارة الأوقاف السكنية', 'residential', 'حي طيبة', 200000),
  ('المستودع المركزي', 'warehouse', 'المنطقة الصناعية', 150000);

INSERT INTO public.price_catalog (facility_type, service_name, standard_price) VALUES
  ('ac', 'صيانة تكييف مركزي', 250),
  ('elec', 'أعطال كهربائية', 150),
  ('plumbing', 'أعطال سباكة', 120),
  ('fire', 'فحص أنظمة حريق', 450),
  ('elev', 'صيانة مصاعد', 600);

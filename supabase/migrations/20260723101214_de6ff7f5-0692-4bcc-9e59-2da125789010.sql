
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'facility_manager', 'technician');
CREATE TYPE public.building_type AS ENUM ('main_admin', 'school', 'residential', 'warehouse', 'branch_office');
CREATE TYPE public.facility_category AS ENUM ('interior', 'exterior');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'in_progress', 'completed', 'rejected');
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- ============ TIMESTAMP TRIGGER ============
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ BUILDINGS ============
CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type building_type NOT NULL,
  location TEXT,
  annual_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.buildings TO authenticated;
GRANT ALL ON public.buildings TO service_role;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_buildings_updated BEFORE UPDATE ON public.buildings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  assigned_building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.get_user_building(_user_id UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT assigned_building_id FROM public.profiles WHERE id = _user_id;
$$;

-- Policies for user_roles
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policies for profiles
CREATE POLICY "Users read own profile or admin reads all" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins update any profile" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Policies for buildings
CREATE POLICY "Authenticated read buildings" ON public.buildings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage buildings" ON public.buildings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ FACILITIES ============
CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category facility_category NOT NULL,
  facility_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.facilities TO authenticated;
GRANT ALL ON public.facilities TO service_role;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read facilities" ON public.facilities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage facilities" ON public.facilities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ PRICE CATALOG ============
CREATE TABLE public.price_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_type TEXT NOT NULL UNIQUE,
  service_name TEXT NOT NULL,
  standard_price NUMERIC(10,2) NOT NULL,
  unit TEXT DEFAULT 'per_service',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.price_catalog TO authenticated;
GRANT ALL ON public.price_catalog TO service_role;
ALTER TABLE public.price_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read prices" ON public.price_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage prices" ON public.price_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ MAINTENANCE REQUESTS ============
CREATE TABLE public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  priority priority_level NOT NULL DEFAULT 'medium',
  estimated_cost NUMERIC(10,2) DEFAULT 0,
  actual_cost NUMERIC(10,2),
  admin_notes TEXT,
  technician_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.maintenance_requests TO authenticated;
GRANT ALL ON public.maintenance_requests TO service_role;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_req_updated BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Facility managers see requests of their building
CREATE POLICY "FM sees own building requests" ON public.maintenance_requests FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'facility_manager') AND building_id = public.get_user_building(auth.uid()))
    OR (public.has_role(auth.uid(), 'technician') AND assigned_to = auth.uid())
    OR reported_by = auth.uid()
  );

CREATE POLICY "FM creates requests for own building" ON public.maintenance_requests FOR INSERT TO authenticated
  WITH CHECK (
    reported_by = auth.uid()
    AND (
      public.has_role(auth.uid(), 'admin')
      OR (public.has_role(auth.uid(), 'facility_manager') AND building_id = public.get_user_building(auth.uid()))
    )
  );

CREATE POLICY "Admins update any request" ON public.maintenance_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians update assigned requests" ON public.maintenance_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'technician') AND assigned_to = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'technician') AND assigned_to = auth.uid());

-- ============ SEED DATA ============
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

-- Seed facilities per building
DO $$
DECLARE b RECORD;
BEGIN
  FOR b IN SELECT id FROM public.buildings LOOP
    INSERT INTO public.facilities (building_id, name, category, facility_type) VALUES
      (b.id, 'الحدائق والمسطحات الخضراء', 'exterior', 'garden_trimming'),
      (b.id, 'مواقف السيارات والمظلات', 'exterior', 'parking_maintenance'),
      (b.id, 'الإنارة الخارجية', 'exterior', 'lighting_replacement'),
      (b.id, 'الأسوار والبوابات الإلكترونية', 'exterior', 'fence_gate_repair'),
      (b.id, 'الواجهات الخارجية', 'exterior', 'facade_cleaning'),
      (b.id, 'المصاعد', 'interior', 'elevator_maintenance'),
      (b.id, 'الشبكات الكهربائية والإنارة', 'interior', 'electrical_repair'),
      (b.id, 'الأثاث المكتبي والمدرسي', 'interior', 'furniture_repair'),
      (b.id, 'الأبواب والأنظمة الذكية', 'interior', 'door_smart_system'),
      (b.id, 'التكييف والتهوية', 'interior', 'ac_maintenance'),
      (b.id, 'أنظمة السلامة والإطفاء', 'interior', 'fire_safety');
  END LOOP;
END $$;

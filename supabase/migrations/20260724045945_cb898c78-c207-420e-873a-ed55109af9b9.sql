CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

DROP POLICY IF EXISTS "Master_Access" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "profiles_insert_own_or_admin" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "profiles_delete_admin_only" ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Master_Access" ON public.user_roles;
CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "user_roles_insert_admin" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "user_roles_update_admin" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "user_roles_delete_admin" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buildings_read_all" ON public.buildings FOR SELECT TO authenticated USING (true);
CREATE POLICY "buildings_admin_manage" ON public.buildings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "facilities_read_all" ON public.facilities FOR SELECT TO authenticated USING (true);
CREATE POLICY "facilities_admin_manage" ON public.facilities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "price_catalog_read_all" ON public.price_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "price_catalog_admin_manage" ON public.price_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "requests_admin_all" ON public.maintenance_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "requests_manager_read" ON public.maintenance_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'facility_manager'::public.app_role)
    AND building_id = public.get_user_building(auth.uid()));

CREATE POLICY "requests_manager_insert" ON public.maintenance_requests FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'facility_manager'::public.app_role)
    AND building_id = public.get_user_building(auth.uid()));

CREATE POLICY "requests_technician_read" ON public.maintenance_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'technician'::public.app_role)
    AND assigned_to = auth.uid());

CREATE POLICY "requests_technician_update" ON public.maintenance_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'technician'::public.app_role) AND assigned_to = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'technician'::public.app_role) AND assigned_to = auth.uid());
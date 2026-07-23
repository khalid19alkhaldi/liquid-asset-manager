import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";

export function useSession() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    // Initial fetch
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));

    // Live listener
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return user;
}

export function useAuth() {
  const user = useSession();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["auth-user-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null;

      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*, building:buildings(*)").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      const role = roles?.[0]?.role ?? null;
      return { profile, role, user };
    },
    // Keep data fresh for 5 mins, but allow background refetch
    staleTime: 1000 * 60 * 5,
  });

  // Listener for profile/role changes in real-time
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('auth-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, () => queryClient.invalidateQueries({ queryKey: ["auth-user-profile", user.id] }))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_roles',
        filter: `user_id=eq.${user.id}`
      }, () => queryClient.invalidateQueries({ queryKey: ["auth-user-profile", user.id] }))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    ...query,
    user,
    isAuthenticated: !!user,
    isLoading: user === undefined || query.isLoading,
  };
}

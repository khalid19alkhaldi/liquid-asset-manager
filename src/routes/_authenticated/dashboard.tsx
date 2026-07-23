import { createFileRoute } from "@tanstack/react-router";
import { useCurrentProfile } from "@/hooks/useSession";
import { AppHeader } from "@/components/AppHeader";
import { FacilityManagerView } from "@/features/dashboards/FacilityManagerView";
import { AdminView } from "@/features/dashboards/AdminView";
import { TechnicianView } from "@/features/dashboards/TechnicianView";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — بوابة جمعية الجبيل" },
      { name: "description", content: "لوحة تحكم صيانة أصول جمعية الجبيل." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useCurrentProfile();

  if (isLoading || !data) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="glass-card animate-pulse p-10 text-center text-muted-foreground">جارٍ التحميل...</div>
        </div>
      </div>
    );
  }

  const { profile, role, user } = data;
  const displayName = profile?.full_name ?? user?.email ?? "";

  return (
    <div className="min-h-screen">
      <AppHeader userName={displayName} role={role} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {!role && (
          <GlassCard>
            <h2 className="mb-2 font-bold text-secondary">لم يتم تعيين دور لحسابك بعد</h2>
            <p className="text-sm text-muted-foreground">
              الرجاء التواصل مع مدير الصيانة العام لتعيين دورك وربطك بالمبنى المخصص.
            </p>
          </GlassCard>
        )}
        {role === "facility_manager" && <FacilityManagerView profile={profile} />}
        {role === "admin" && <AdminView />}
        {role === "technician" && <TechnicianView userId={user!.id} />}
      </main>
    </div>
  );
}

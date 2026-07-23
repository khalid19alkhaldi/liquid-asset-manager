import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
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
  const { data, isLoading } = useAuth();

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <AppHeader />
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="glass-panel flex h-40 items-center justify-center text-slate-400">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
              <span>جارٍ تحميل بياناتك...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { profile, role, user } = data;
  const displayName = profile?.full_name ?? user?.email ?? "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppHeader userName={displayName} role={role} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {!role && (
          <GlassCard className="border-amber-100 bg-amber-50/30">
            <h2 className="mb-2 text-lg font-bold text-amber-900 dark:text-amber-400">لم يتم تعيين دور لحسابك بعد</h2>
            <p className="text-sm text-amber-800/80 dark:text-amber-500/80">
              الرجاء التواصل مع مدير الصيانة العام لتعيين دورك وربطك بالمبنى المخصص. يمكنك التواصل عبر نظام المراسلات الداخلي أو التوجه لمكتب الإدارة.
            </p>
          </GlassCard>
        )}

        {role === "admin" && <AdminView />}
        {role === "facility_manager" && <FacilityManagerView profile={profile} />}
        {role === "technician" && <TechnicianView userId={user!.id} />}
      </main>
    </div>
  );
}

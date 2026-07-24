import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { FacilityManagerView } from "@/features/dashboards/FacilityManagerView";
import { AdminView } from "@/features/dashboards/AdminView";
import { TechnicianView } from "@/features/dashboards/TechnicianView";
import { ShieldAlert } from "lucide-react";
import { useState } from "react";

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
  const [activeTab, setActiveTab] = useState("stats");

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <div className="text-sm font-bold text-slate-400">جارٍ تهيئة لوحة التحكم...</div>
        </div>
      </div>
    );
  }

  const { profile, role, user } = data;
  const displayName = profile?.full_name ?? user?.email ?? "مستخدم";

  return (
    <DashboardLayout userName={displayName} role={role} activeTab={activeTab} onTabChange={setActiveTab}>
      {!role && (
        <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-10 text-center">
          <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-amber-500" />
          <h2 className="mb-2 text-2xl font-black text-amber-900">بانتظار تفعيل الصلاحيات</h2>
          <p className="mx-auto max-w-md text-sm font-medium text-amber-800/70">
            أهلاً بك في بوابة الجبيل للأصول. حسابك حالياً قيد المراجعة، يرجى التواصل مع الإدارة لتعيين دورك الوظيفي وربطك بالمنشأة المناسبة.
          </p>
        </div>
      )}

      {role === "admin" && <AdminView externalTab={activeTab} />}
      {role === "facility_manager" && <FacilityManagerView profile={profile} />}
      {role === "technician" && <TechnicianView userId={user!.id} />}
    </DashboardLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { EmployeePortal } from "@/features/portals/EmployeePortal";
import { ContractorPortal } from "@/features/portals/ContractorPortal";
import { ShieldAlert } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "بوابة العمليات — SHQ Jubail" },
      { name: "description", content: "لوحة التحكم الموحدة لإدارة الأصول وصيانة المرافق." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("stats");

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">تحميل البيانات الآمنة...</div>
        </div>
      </div>
    );
  }

  const { profile, role, user } = data;
  const displayName = profile?.full_name ?? user?.email ?? "مستخدم";

  return (
    <DashboardLayout userName={displayName} role={role} activeTab={activeTab} onTabChange={setActiveTab}>
      {!role && (
        <div className="rounded-[3rem] border-2 border-dashed border-amber-100 bg-amber-50/30 p-20 text-center">
          <ShieldAlert className="mx-auto mb-6 h-16 w-16 text-amber-500" />
          <h2 className="mb-2 text-3xl font-black text-amber-900">بانتظار الاعتماد الرقمي</h2>
          <p className="mx-auto max-w-md text-sm font-medium text-amber-800/70 leading-relaxed">
            حسابك حالياً قيد المراجعة الأمنية. سيتم تفعيل صلاحياتك وربطك بالمنشأة المناسبة من قبل الإدارة العامة خلال 24 ساعة.
          </p>
        </div>
      )}

      {role === "contractor" ? (
        <ContractorPortal userId={user!.id} />
      ) : (
        <EmployeePortal profile={profile} role={role!} />
      )}
    </DashboardLayout>
  );
}

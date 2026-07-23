import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { BudgetBar } from "@/components/BudgetBar";
import { StatusPill, PriorityPill } from "@/components/StatusPill";
import { formatSAR, buildingTypeLabel, roleLabel } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Filter, Plus, Users, LayoutDashboard, ClipboardList, ShieldAlert } from "lucide-react";

export function AdminView() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"stats" | "requests" | "users">("stats");
  const [filterBuilding, setFilterBuilding] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");

  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => (await supabase.from("buildings").select("*").order("name")).data ?? [],
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["all-requests"],
    queryFn: async () => (await supabase.from("maintenance_requests").select("*, building:buildings(name), facility:facilities(name)").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["admin-users"],
    enabled: activeTab === "users",
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*, roles:user_roles(role)");
      return profiles ?? [];
    },
  });

  const filtered = requests.filter((r: any) => {
    if (filterBuilding && r.building_id !== filterBuilding) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  async function updateRequest(id: string, patch: any) {
    const { error } = await supabase.from("maintenance_requests").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("تم تحديث البلاغ");
      qc.invalidateQueries({ queryKey: ["all-requests"] });
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    const { error } = await supabase.from("user_roles").upsert({ user_id: userId, role: newRole }, { onConflict: "user_id, role" });
    if (error) toast.error(error.message);
    else {
      toast.success("تم تحديث الدور بنجاح");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    }
  }

  const totalBudget = buildings.reduce((s: number, b: any) => s + Number(b.annual_budget), 0);
  const totalSpent = requests
    .filter((r: any) => r.status === "completed")
    .reduce((s: number, r: any) => s + Number(r.actual_cost ?? r.estimated_cost ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 rounded-2xl bg-white/40 p-1 backdrop-blur-md dark:bg-slate-900/40">
        {[
          { id: "stats", label: "نظرة عامة", icon: LayoutDashboard },
          { id: "requests", label: "البلاغات", icon: ClipboardList },
          { id: "users", label: "إدارة الموظفين", icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-white text-indigo-600 shadow-md dark:bg-slate-800 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "stats" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid gap-4 md:grid-cols-3">
            <GlassCard>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">إجمالي المباني</div>
              <div className="mt-1 text-4xl font-black text-indigo-600 dark:text-indigo-400">{buildings.length}</div>
            </GlassCard>
            <GlassCard>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">البلاغات النشطة</div>
              <div className="mt-1 text-4xl font-black text-amber-500">{requests.filter(r => r.status !== 'completed' && r.status !== 'rejected').length}</div>
            </GlassCard>
            <GlassCard>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">نسبة الإنجاز</div>
              <div className="mt-1 text-4xl font-black text-emerald-500">
                {requests.length ? Math.round((requests.filter(r => r.status === 'completed').length / requests.length) * 100) : 0}%
              </div>
            </GlassCard>
          </div>

          <div className="mt-6">
            <h2 className="mb-4 text-lg font-black text-slate-800 dark:text-white">الميزانية الإجمالية</h2>
            <BudgetBar total={totalBudget} spent={totalSpent} label="المجموع الكلي للجمعية" />
          </div>

          <div className="mt-8">
            <h2 className="mb-4 text-lg font-black text-slate-800 dark:text-white">حالة المباني</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {buildings.map((b: any) => {
                const bSpent = requests
                  .filter((r: any) => r.building_id === b.id && r.status === "completed")
                  .reduce((s: number, r: any) => s + Number(r.actual_cost ?? r.estimated_cost ?? 0), 0);
                return (
                  <GlassCard key={b.id} interactive onClick={() => { setSelectedBuildingId(b.id); setShowForm(true); }}>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-slate-800">
                        <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <Plus className="h-5 w-5 text-slate-300" />
                    </div>
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{buildingTypeLabel(b.type)}</div>
                    <div className="mb-4 text-lg font-black text-slate-800 dark:text-white">{b.name}</div>
                    <BudgetBar total={Number(b.annual_budget)} spent={bSpent} label="ميزانية المبنى" />
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "requests" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-800 dark:text-white">سجل البلاغات</h2>
            <div className="flex gap-2">
              <select value={filterBuilding} onChange={(e) => setFilterBuilding(e.target.value)} className="glass-input h-10 min-w-40 text-sm">
                <option value="">جميع المباني</option>
                {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="glass-input h-10 text-sm">
                <option value="">جميع الحالات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="approved">معتمد</option>
                <option value="in_progress">جاري التنفيذ</option>
                <option value="completed">مكتمل</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4">
            {filtered.map((r: any) => (
              <GlassCard key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-black text-slate-800 dark:text-white">{r.title}</h3>
                      <StatusPill status={r.status} />
                      <PriorityPill priority={r.priority} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{r.description}</p>
                    <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500 dark:border-slate-800">
                      <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {r.building?.name}</span>
                      {r.facility && <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{r.facility.name}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 min-w-[200px]">
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase text-slate-400">التكلفة التقديرية</div>
                      <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatSAR(r.estimated_cost)}</div>
                    </div>

                    <div className="flex gap-2">
                      {r.status === "pending" && (
                        <>
                          <button onClick={() => updateRequest(r.id, { status: "approved" })} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700">اعتماد</button>
                          <button onClick={() => updateRequest(r.id, { status: "rejected" })} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200">رفض</button>
                        </>
                      )}
                      {r.status === "approved" && (
                        <button onClick={() => updateRequest(r.id, { status: "in_progress" })} className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-amber-100 transition-all hover:bg-amber-600">بدء العمل</button>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800 dark:text-white">إدارة الحسابات والأدوار</h2>
            <p className="text-sm text-slate-500">يمكنك هنا تغيير صلاحيات الموظفين وربطهم بالأدوار المناسبة.</p>
          </div>

          <div className="grid gap-3">
            {allUsers.map((u: any) => (
              <GlassCard key={u.id}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <Users className="h-6 w-6 text-slate-500" />
                    </div>
                    <div>
                      <div className="font-black text-slate-800 dark:text-white">{u.full_name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4">
                      <div className="text-[10px] font-bold text-slate-400">الدور الحالي</div>
                      <div className="text-sm font-bold text-indigo-600">{u.roles?.[0]?.role ? roleLabel(u.roles[0].role) : 'بدون دور'}</div>
                    </div>
                    <select
                      onChange={(e) => updateUserRole(u.id, e.target.value)}
                      defaultValue={u.roles?.[0]?.role || ""}
                      className="glass-input h-10 text-sm"
                    >
                      <option value="">اختر دوراً...</option>
                      <option value="admin">مدير عام</option>
                      <option value="facility_manager">مسؤول منشأة</option>
                      <option value="technician">فني صيانة</option>
                    </select>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {showForm && selectedBuildingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl">
            <NewRequestForm
              buildingId={selectedBuildingId}
              onClose={() => setShowForm(false)}
              onCreated={() => {
                qc.invalidateQueries({ queryKey: ["all-requests"] });
                setShowForm(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NewRequestForm({ buildingId, onClose, onCreated }: { buildingId: string; onClose: () => void; onCreated: () => void }) {
  const [facilityId, setFacilityId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [loading, setLoading] = useState(false);

  const { data: facilities = [] } = useQuery({
    queryKey: ["facilities", buildingId],
    queryFn: async () => {
      const { data } = await supabase.from("facilities").select("id, name, category, facility_type").eq("building_id", buildingId).order("category");
      return data ?? [];
    },
  });

  const selected = facilities.find((f: any) => f.id === facilityId);

  const { data: estimate } = useQuery({
    queryKey: ["price", selected?.facility_type],
    enabled: !!selected?.facility_type,
    queryFn: async () => {
      const { data } = await supabase.from("price_catalog").select("standard_price").eq("facility_type", selected!.facility_type).maybeSingle();
      return data?.standard_price ?? 0;
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("maintenance_requests").insert({
        building_id: buildingId,
        facility_id: facilityId || null,
        title,
        description,
        priority,
        reported_by: auth.user?.id,
        estimated_cost: estimate ?? 0,
      });
      if (error) throw error;
      toast.success("تم إرسال البلاغ بنجاح");
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "فشل الإرسال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className="border-indigo-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <h3 className="text-xl font-black text-slate-800 dark:text-white">إنشاء بلاغ صيانة</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">إغلاق</button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">المرفق المتضرر</label>
            <select required value={facilityId} onChange={(e) => setFacilityId(e.target.value)} className="glass-input h-11 text-sm">
              <option value="">اختر المرفق...</option>
              <optgroup label="مرافق داخلية">
                {facilities.filter((f: any) => f.category === "interior").map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </optgroup>
              <optgroup label="مرافق خارجية">
                {facilities.filter((f: any) => f.category === "exterior").map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">الأولوية</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="glass-input h-11 text-sm">
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">طارئة جداً</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">عنوان موجز للعطل</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="glass-input h-11 text-sm" placeholder="مثال: تسرب مياه في دورات المياه" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">وصف دقيق للمشكلة</label>
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="glass-input min-h-24 py-3 text-sm" placeholder="اشرح لنا تفاصيل العطل..." />
        </div>

        {selected && (
          <div className="flex items-center justify-between rounded-2xl bg-indigo-50/50 p-4 dark:bg-indigo-950/20">
            <div className="text-sm font-bold text-slate-600 dark:text-slate-400">التكلفة التقديرية بناءً على نوع المرفق:</div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatSAR(estimate ?? 0)}</div>
          </div>
        )}

        <button disabled={loading} className="btn-primary h-12 w-full text-base font-black shadow-lg shadow-indigo-200">
          {loading ? "جارٍ الإرسال..." : "تأكيد وإرسال البلاغ"}
        </button>
      </form>
    </GlassCard>
  );
}

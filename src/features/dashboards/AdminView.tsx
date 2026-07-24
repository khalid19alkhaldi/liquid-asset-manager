import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BudgetBar } from "@/components/BudgetBar";
import { StatusPill, PriorityPill } from "@/components/StatusPill";
import { formatSAR, buildingTypeLabel, roleLabel } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Filter,
  Plus,
  Users,
  PieChart,
  ClipboardList,
  ShieldAlert,
  Trash2,
  TrendingUp,
  Wallet,
  AlertTriangle
} from "lucide-react";

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

  const { data: allUsers = [], isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ["admin-users"],
    enabled: activeTab === "users",
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from("profiles").select("*, user_roles(role)");
      if (error) throw error;
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

  async function deleteUser(userId: string, fullName: string) {
    if (!confirm(`هل أنت متأكد من حذف حساب "${fullName}"؟`)) return;
    try {
      const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });
      if (error) throw error;
      toast.success("تم حذف الحساب");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err: any) {
      toast.error(err.message || "فشل الحذف");
    }
  }

  const totalBudget = buildings.reduce((s: number, b: any) => s + Number(b.annual_budget), 0);
  const totalSpent = requests
    .filter((r: any) => r.status === "completed")
    .reduce((s: number, r: any) => s + Number(r.actual_cost ?? r.estimated_cost ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* Sub-Navigation for sections */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: "stats", label: "نظرة عامة", icon: PieChart },
          { id: "requests", label: "إدارة البلاغات", icon: ClipboardList },
          { id: "users", label: "شؤون الموظفين", icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative flex items-center gap-2 pb-4 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "text-primary dark:text-emerald-400"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 h-0.5 w-full bg-primary dark:bg-emerald-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === "stats" && (
        <div className="space-y-8">
          {/* Executive Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="إجمالي البلاغات"
              value={requests.length}
              icon={ClipboardList}
              color="indigo"
            />
            <StatCard
              label="بلاغات نشطة"
              value={requests.filter(r => r.status !== 'completed' && r.status !== 'rejected').length}
              icon={TrendingUp}
              color="emerald"
            />
            <StatCard
              label="تحت المراجعة"
              value={requests.filter(r => r.status === 'pending').length}
              icon={AlertTriangle}
              color="amber"
            />
            <StatCard
              label="إجمالي المباني"
              value={buildings.length}
              icon={Building2}
              color="slate"
            />
          </div>

          {/* Budget Overview Section */}
          <div className="inst-card overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-secondary dark:text-white">الميزانية السنوية العامة</h2>
                  <p className="text-xs font-bold text-slate-400">إجمالي المخصصات لجميع مرافق الجمعية</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <BudgetBar total={totalBudget} spent={totalSpent} label="المجموع الكلي المعتمد" />
              <div className="mt-6 flex gap-8">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">إجمالي المصروف</div>
                  <div className="text-xl font-black text-secondary">{formatSAR(totalSpent)}</div>
                </div>
                <div className="h-10 w-px bg-slate-100 dark:bg-slate-800" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">المتبقي المتوفر</div>
                  <div className="text-xl font-black text-primary">{formatSAR(totalBudget - totalSpent)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Buildings Grid */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="section-title">حالة صيانة المباني</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {buildings.map((b: any) => {
                const bSpent = requests
                  .filter((r: any) => r.building_id === b.id && r.status === "completed")
                  .reduce((s: number, r: any) => s + Number(r.actual_cost ?? r.estimated_cost ?? 0), 0);
                return (
                  <div
                    key={b.id}
                    onClick={() => { setSelectedBuildingId(b.id); setShowForm(true); }}
                    className="inst-card inst-card-hover group cursor-pointer p-6"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500 uppercase">
                        {buildingTypeLabel(b.type)}
                      </div>
                    </div>
                    <h3 className="mb-1 text-lg font-black text-secondary group-hover:text-primary">{b.name}</h3>
                    <p className="mb-5 text-xs font-bold text-slate-400">آخر فحص: منذ يومين</p>
                    <BudgetBar total={Number(b.annual_budget)} spent={bSpent} label="ميزانية التشغيل" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "requests" && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h2 className="section-title">سجل بلاغات الصيانة</h2>
            <div className="flex gap-3">
              <select value={filterBuilding} onChange={(e) => setFilterBuilding(e.target.value)} className="glass-input h-11 min-w-48 text-sm font-bold">
                <option value="">جميع المواقع</option>
                {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="glass-input h-11 text-sm font-bold">
                <option value="">الحالة (الكل)</option>
                <option value="pending">بانتظار المراجعة</option>
                <option value="approved">معتمد للتنفيذ</option>
                <option value="in_progress">جاري العمل</option>
                <option value="completed">مكتمل</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filtered.map((r: any) => (
              <div key={r.id} className="inst-card overflow-hidden border-r-4 border-r-primary">
                <div className="flex flex-wrap items-center justify-between gap-6 p-6">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-xs font-black text-slate-400 tabular-nums">#{r.id.slice(0, 5)}</span>
                      <h3 className="text-lg font-black text-secondary">{r.title}</h3>
                      <StatusPill status={r.status} />
                      <PriorityPill priority={r.priority} />
                    </div>
                    <p className="text-sm font-medium text-slate-500 line-clamp-2">{r.description}</p>
                    <div className="mt-4 flex gap-6">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <Building2 className="h-3.5 w-3.5" /> {r.building?.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <TrendingUp className="h-3.5 w-3.5" /> {r.facility?.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-left">
                      <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">التكلفة المتوقعة</div>
                      <div className="text-xl font-black text-primary tabular-nums">{formatSAR(r.estimated_cost)}</div>
                    </div>

                    <div className="flex gap-2">
                      {r.status === "pending" && (
                        <>
                          <button onClick={() => updateRequest(r.id, { status: "approved" })} className="btn-primary py-2 px-6 text-xs">اعتماد</button>
                          <button onClick={() => updateRequest(r.id, { status: "rejected" })} className="btn-outline py-2 px-6 text-xs">إلغاء</button>
                        </>
                      )}
                      {r.status === "approved" && (
                        <button onClick={() => updateRequest(r.id, { status: "in_progress" })} className="btn-gold py-2 px-6 text-xs">بدء العمل</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <div className="mb-8">
            <h2 className="section-title">صلاحيات النظام</h2>
            <p className="mt-2 text-sm font-medium text-slate-400 pr-4">إدارة الوصول للموظفين وتغيير الأدوار الوظيفية داخل المنصة.</p>
          </div>

          {isLoadingUsers ? (
            <LoadingState label="جارٍ مزامنة بيانات الموظفين..." />
          ) : (
            <div className="space-y-3">
              {allUsers.map((u: any) => (
                <div key={u.id} className="inst-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 font-black text-slate-400 border border-slate-100">
                        {u.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-black text-secondary leading-tight">{u.full_name || 'موظف جديد'}</div>
                        <div className="text-xs font-bold text-slate-400 tabular-nums">{u.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left ml-6">
                        <div className="text-[10px] font-bold uppercase text-slate-300">الصلاحية</div>
                        <div className="text-sm font-black text-primary">{u.user_roles?.[0]?.role ? roleLabel(u.user_roles[0].role) : 'معلق'}</div>
                      </div>

                      <select
                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                        defaultValue={u.user_roles?.[0]?.role || ""}
                        className="glass-input h-10 min-w-36 text-xs font-bold"
                      >
                        <option value="">تغيير الدور...</option>
                        <option value="admin">مدير عام</option>
                        <option value="facility_manager">مسؤول منشأة</option>
                        <option value="technician">فني صيانة</option>
                      </select>

                      <button
                        onClick={() => deleteUser(u.id, u.full_name)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-all hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && selectedBuildingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-200">
            <NewRequestForm
              buildingId={selectedBuildingId}
              onClose={() => setShowForm(false)}
              onCreated={() => { qc.invalidateQueries({ queryKey: ["all-requests"] }); setShowForm(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    slate: "text-slate-600 bg-slate-50 border-slate-100",
  };

  return (
    <div className="inst-card p-6 border-b-4 border-b-transparent hover:border-b-primary">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-1 text-3xl font-black text-secondary tabular-nums">{value}</div>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-300">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <div className="text-sm font-bold">{label}</div>
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
    <div className="inst-card bg-white p-0 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
        <h3 className="text-xl font-black text-secondary">إضافة بلاغ صيانة جديد</h3>
        <button type="button" onClick={onClose} className="rounded-full bg-slate-50 p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-6 p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">المرفق</label>
            <select required value={facilityId} onChange={(e) => setFacilityId(e.target.value)} className="glass-input font-bold text-sm">
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
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">الأولوية</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="glass-input font-bold text-sm">
              <option value="low">عادية</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">طارئة جداً</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500">عنوان البلاغ</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="glass-input font-bold text-sm" placeholder="وصف موجز للمشكلة" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500">تفاصيل العطل</label>
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="glass-input min-h-32 py-4 font-bold text-sm" placeholder="يرجى كتابة شرح مفصل للمشكلة..." />
        </div>

        {selected && (
          <div className="flex items-center justify-between rounded-2xl bg-primary/5 p-6 border border-primary/10">
            <div className="text-sm font-bold text-primary">التكلفة التقديرية للصيانة:</div>
            <div className="text-3xl font-black text-primary tabular-nums">{formatSAR(estimate ?? 0)}</div>
          </div>
        )}

        <div className="flex gap-4 pt-2">
          <button disabled={loading} className="btn-primary h-14 flex-1 text-base font-black">
            {loading ? "جارٍ الحفظ..." : "تأكيد وإرسال البلاغ"}
          </button>
          <button type="button" onClick={onClose} className="btn-outline h-14 px-10">إلغاء</button>
        </div>
      </form>
    </div>
  );
}

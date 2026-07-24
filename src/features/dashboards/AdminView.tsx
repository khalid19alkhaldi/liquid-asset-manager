import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BudgetBar } from "@/components/BudgetBar";
import { StatusPill, PriorityPill } from "@/components/StatusPill";
import { formatSAR, buildingTypeLabel, roleLabel } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Users,
  ClipboardList,
  ShieldAlert,
  Trash2,
  TrendingUp,
  Wallet,
  AlertTriangle,
  X,
  Clock,
  ArrowUpRight,
  Filter,
  Search,
  History,
  FileSearch
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface AdminViewProps {
  externalTab?: string;
}

export function AdminView({ externalTab = "stats" }: AdminViewProps) {
  const qc = useQueryClient();
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
    enabled: externalTab === "users",
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from("profiles").select("*, user_roles(role)");
      if (error) throw error;
      return profiles ?? [];
    },
  });

  const { data: auditLogs = [], isLoading: isLoadingAudit } = useQuery({
    queryKey: ["audit-logs"],
    enabled: externalTab === "audit",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
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
      toast.success("تم تحديث الحالة");
      qc.invalidateQueries({ queryKey: ["all-requests"] });
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    const { error } = await supabase.from("user_roles").upsert({ user_id: userId, role: newRole as any }, { onConflict: "user_id, role" });
    if (error) toast.error(error.message);
    else {
      toast.success("تم تحديث صلاحيات الموظف");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    }
  }

  async function deleteUser(userId: string, fullName: string) {
    if (!confirm(`هل أنت متأكد من حذف حساب "${fullName}" نهائياً؟`)) return;
    try {
      const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });
      if (error) throw error;
      toast.success("تم حذف المستخدم بنجاح");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err: any) {
      toast.error(err.message || "فشل إجراء الحذف");
    }
  }

  const totalBudget = buildings.reduce((s: number, b: any) => s + Number(b.annual_budget), 0);
  const totalSpent = requests
    .filter((r: any) => r.status === "completed")
    .reduce((s: number, r: any) => s + Number(r.actual_cost ?? r.estimated_cost ?? 0), 0);

  // Chart Data preparation
  const chartData = buildings.map(b => {
    const spent = requests
      .filter((r: any) => r.building_id === b.id && r.status === "completed")
      .reduce((s: number, r: any) => s + Number(r.actual_cost ?? r.estimated_cost ?? 0), 0);
    return {
      name: b.name,
      budget: b.annual_budget,
      spent: spent
    };
  });

  return (
    <div className="space-y-12">
      {externalTab === "stats" && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Executive Metric Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="بلاغات نشطة"
              value={requests.filter(r => r.status !== 'completed' && r.status !== 'rejected').length}
              icon={TrendingUp}
              trend="+12% من الأسبوع الماضي"
              isPositive={false}
            />
            <MetricCard
              label="تم الإنجاز"
              value={requests.filter(r => r.status === 'completed').length}
              icon={ClipboardList}
              trend="↑ 8 بلاغات مكتملة اليوم"
              isPositive={true}
            />
            <MetricCard
              label="تحت المراجعة"
              value={requests.filter(r => r.status === 'pending').length}
              icon={AlertTriangle}
              trend="يتطلب تدخل إداري"
              isWarning={true}
            />
            <MetricCard
              label="المباني المغطاة"
              value={buildings.length}
              icon={Building2}
              trend="تغطية شاملة 100%"
              isPositive={true}
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Visual Performance Chart */}
            <div className="lg:col-span-2 glass-card p-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-none">تحليل الصرف والميزانية</h2>
                  <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">الأداء المالي للمباني (ريال)</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                    <div className="h-2 w-2 rounded-full bg-primary" /> الميزانية
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                    <div className="h-2 w-2 rounded-full bg-gold" /> المصروف
                  </div>
                </div>
              </div>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 800 }}
                    />
                    <Bar dataKey="budget" fill="#005a34" radius={[6, 6, 0, 0]} barSize={40} />
                    <Bar dataKey="spent" fill="#c5a059" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Actions & High Priority */}
            <div className="space-y-6">
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary h-24 w-full flex-col items-center justify-center gap-1 rounded-3xl"
              >
                <Plus className="h-6 w-6" />
                <span className="text-base font-black">فتح بلاغ صيانة جديد</span>
              </button>

              <div className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    آخر التحديثات
                  </h3>
                  <button className="text-[10px] font-black text-primary hover:underline">عرض الكل</button>
                </div>
                <div className="space-y-4">
                  {requests.slice(0, 4).map((r: any) => (
                    <div key={r.id} className="group flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-primary/5 transition-colors border border-slate-100">
                        <TrendingUp className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                      </div>
                      <div className="min-w-0 flex-1 text-right">
                        <div className="truncate text-xs font-black text-slate-800">{r.title}</div>
                        <div className="mt-0.5 text-[10px] font-bold text-slate-400">بواسطة: {r.reported_by || "الإدارة"}</div>
                      </div>
                      <div className="text-[9px] font-bold text-slate-300 tabular-nums">12د</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Building Portfolio Grid */}
          <div>
            <div className="mb-8">
              <h2 className="section-title">محفظة الأصول والمباني</h2>
              <p className="mt-2 text-xs font-bold text-slate-400 pr-1">اضغط على أي مبنى لإضافة بلاغ صيانة مباشر أو مراجعة التفاصيل.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {buildings.map((b: any) => {
                const bSpent = requests
                  .filter((r: any) => r.building_id === b.id && r.status === "completed")
                  .reduce((s: number, r: any) => s + Number(r.actual_cost ?? r.estimated_cost ?? 0), 0);
                return (
                  <BuildingGridCard
                    key={b.id}
                    building={b}
                    spent={bSpent}
                    onClick={() => { setSelectedBuildingId(b.id); setShowForm(true); }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {(externalTab === "requests" || externalTab === "buildings") && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="section-title">تتبع بلاغات الصيانة</h2>
              <p className="mt-1 text-xs font-bold text-slate-400 pr-1">إدارة واعتماد طلبات الصيانة من جميع مرافق الجمعية.</p>
            </div>
            <div className="flex gap-3 items-center bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
              <Filter className="h-4 w-4 text-slate-300 mr-2" />
              <select value={filterBuilding} onChange={(e) => setFilterBuilding(e.target.value)} className="h-10 min-w-40 border-none bg-transparent text-[11px] font-black focus:ring-0">
                <option value="">كافة المباني</option>
                {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div className="h-6 w-px bg-slate-100" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 min-w-32 border-none bg-transparent text-[11px] font-black focus:ring-0">
                <option value="">جميع الحالات</option>
                <option value="pending">قيد المراجعة</option>
                <option value="approved">تم الاعتماد</option>
                <option value="in_progress">جاري العمل</option>
                <option value="completed">تم الإنجاز</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filtered.map((r: any) => (
              <RequestFeedItem key={r.id} request={r} onUpdate={updateRequest} />
            ))}
          </div>
        </div>
      )}

      {externalTab === "users" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-10 text-right">
            <h2 className="section-title">إدارة الصلاحيات والموظفين</h2>
            <p className="mt-2 text-xs font-bold text-slate-400 pr-1">التحكم في وصول المستخدمين وتعيين الأدوار الوظيفية داخل المنظومة.</p>
          </div>

          {isLoadingUsers ? (
            <LoadingState label="جارٍ مزامنة سجلات الموظفين..." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {allUsers.map((u: any) => (
                <UserAdminCard key={u.id} user={u} onUpdateRole={updateUserRole} onDelete={deleteUser} />
              ))}
            </div>
          )}
        </div>
      )}

      {externalTab === "audit" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-10 text-right">
            <h2 className="section-title">سجل تدقيق العمليات</h2>
            <p className="mt-2 text-xs font-bold text-slate-400 pr-1">مراقبة كافة التغييرات الحساسة في النظام (الأسعار، الاعتمادات، الحالات).</p>
          </div>

          {isLoadingAudit ? (
            <LoadingState label="جارٍ استرجاع سجل العمليات..." />
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="glass-card p-6 border-r-4 border-r-slate-200">
                  <div className="flex items-start justify-between flex-row-reverse">
                    <div className="flex gap-4 flex-row-reverse">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
                        <History className="h-6 w-6" />
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <span className="font-black text-slate-900">{log.performer_name || "مستخدم غير معرف"}</span>
                          <div className="h-1 w-1 rounded-full bg-slate-200" />
                          <span className="text-[10px] font-bold text-primary uppercase bg-primary/5 px-2 py-0.5 rounded-lg">
                            {log.action_type === 'UPDATE' ? 'تعديل بيانات' : log.action_type}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 flex-row-reverse text-[11px] font-bold text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(log.created_at))}</span>
                          <div className="h-1 w-1 rounded-full bg-slate-200" />
                          <span>الجدول: {log.entity_type}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-rose-50/30 p-4 border border-rose-100/50">
                      <div className="mb-2 text-[9px] font-black text-rose-400 uppercase tracking-widest">البيانات السابقة</div>
                      <pre className="text-[10px] font-bold text-slate-500 overflow-x-auto text-right dir-ltr whitespace-pre-wrap">
                        {JSON.stringify(log.old_values, null, 2)}
                      </pre>
                    </div>
                    <div className="rounded-2xl bg-emerald-50/30 p-4 border border-emerald-100/50">
                      <div className="mb-2 text-[9px] font-black text-emerald-400 uppercase tracking-widest">البيانات الجديدة</div>
                      <pre className="text-[10px] font-bold text-slate-500 overflow-x-auto text-right dir-ltr whitespace-pre-wrap">
                        {JSON.stringify(log.new_values, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="rounded-[2.5rem] border-2 border-dashed border-slate-100 p-20 text-center">
                  <FileSearch className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                  <div className="font-bold text-slate-300">لم يتم تسجيل أي عمليات تدقيق بعد.</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md overflow-y-auto">
          <div className="my-auto w-full max-w-2xl animate-in zoom-in-95 duration-300">
            <NewRequestForm
              buildingId={selectedBuildingId || buildings[0]?.id}
              onClose={() => { setShowForm(false); setSelectedBuildingId(""); }}
              onCreated={() => { qc.invalidateQueries({ queryKey: ["all-requests"] }); setShowForm(false); setSelectedBuildingId(""); }}
              buildings={buildings}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, trend, isPositive, isWarning }: any) {
  return (
    <div className="glass-card p-6 hover:shadow-xl transition-all border-b-4 border-b-transparent hover:border-b-primary group">
      <div className="mb-6 flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
          isWarning ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-primary/5 border-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
        }`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-primary transition-colors cursor-pointer border border-slate-100">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</div>
      <div className="stat-value text-slate-900 tabular-nums leading-none mb-3">{value}</div>
      <div className={`text-[10px] font-bold ${isPositive ? 'text-emerald-500' : isWarning ? 'text-amber-500' : 'text-slate-400'}`}>
        {trend}
      </div>
    </div>
  );
}

function BuildingGridCard({ building, spent, onClick }: any) {
  const percentage = Math.min(Math.round((spent / Number(building.annual_budget || 1)) * 100), 100);

  return (
    <div
      onClick={onClick}
      className="glass-card p-7 group cursor-pointer hover:shadow-2xl transition-all border-r-4 border-r-transparent hover:border-r-primary text-right relative overflow-hidden"
    >
      <div className="absolute -top-4 -left-4 h-24 w-24 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="mb-6 flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm transition-all group-hover:bg-primary group-hover:text-white group-hover:border-primary">
          <Building2 className="h-7 w-7" />
        </div>
        <div className="rounded-xl bg-slate-100/50 px-3 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-wider border border-slate-200/50 group-hover:bg-white group-hover:border-primary/20">
          {buildingTypeLabel(building.type)}
        </div>
      </div>

      <h3 className="mb-2 text-xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight">{building.name}</h3>
      <p className="mb-8 text-[11px] font-bold text-slate-400">آخر عملية صيانة: منذ 3 أيام</p>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-[10px] font-black">
          <span className="text-slate-400">استهلاك الميزانية</span>
          <span className={percentage > 80 ? "text-rose-500" : "text-primary"}>{percentage}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/30">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${percentage > 80 ? "bg-rose-500" : "bg-primary"}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between items-end">
          <div className="text-[10px] font-black text-slate-400">المخصص السنوي</div>
          <div className="text-lg font-black text-slate-900 tabular-nums leading-none">{formatSAR(building.annual_budget)}</div>
        </div>
      </div>
    </div>
  );
}

function RequestFeedItem({ request, onUpdate }: any) {
  return (
    <div className="glass-card overflow-hidden hover:shadow-xl transition-all group border-r-4 border-r-primary/20 hover:border-r-primary">
      <div className="flex flex-wrap items-center justify-between gap-6 p-6 flex-row-reverse">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-3 flex-row-reverse flex-wrap">
            <span className="text-[10px] font-black text-slate-300 tabular-nums uppercase border border-slate-100 px-2 py-0.5 rounded-lg">ID-{request.id.slice(0, 6)}</span>
            <h3 className="text-lg font-black text-slate-900 leading-tight">{request.title}</h3>
            <StatusPill status={request.status} />
            <PriorityPill priority={request.priority} />
          </div>
          <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-2xl text-right">{request.description}</p>
          <div className="mt-5 flex gap-6 flex-row-reverse items-center pt-4 border-t border-slate-50">
            <div className="flex items-center gap-2 text-[11px] font-black text-slate-400">
               {request.building?.name} <Building2 className="h-3.5 w-3.5" />
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-200" />
            <div className="flex items-center gap-2 text-[11px] font-black text-slate-400">
               {request.facility?.name} <TrendingUp className="h-3.5 w-3.5" />
            </div>
            {request.reported_by && (
              <>
                <div className="h-1 w-1 rounded-full bg-slate-200" />
                <div className="flex items-center gap-2 text-[11px] font-black text-slate-400">
                   بواسطة: {request.reported_by} <Users className="h-3.5 w-3.5" />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-5 min-w-[180px]">
          <div className="text-right">
            <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">التكلفة التقديرية</div>
            <div className="text-2xl font-black text-primary tabular-nums leading-none">{formatSAR(request.estimated_cost)}</div>
          </div>

          <div className="flex gap-2">
            {request.status === "pending" && (
              <>
                <button onClick={() => onUpdate(request.id, { status: "approved" })} className="h-10 px-6 rounded-xl bg-primary text-white text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all">اعتماد</button>
                <button onClick={() => onUpdate(request.id, { status: "rejected" })} className="h-10 px-6 rounded-xl bg-slate-100 text-slate-600 text-xs font-black hover:bg-rose-50 hover:text-rose-500 transition-all">إلغاء</button>
              </>
            )}
            {request.status === "approved" && (
              <button onClick={() => onUpdate(request.id, { status: "in_progress" })} className="h-10 px-8 rounded-xl bg-gold text-white text-xs font-black shadow-lg shadow-gold/20 hover:scale-105 transition-all">بدء التنفيذ</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserAdminCard({ user, onUpdateRole, onDelete }: any) {
  const currentRole = user.user_roles?.[0]?.role;

  return (
    <div className="glass-card p-6 hover:shadow-xl transition-all border border-slate-100/50">
      <div className="flex items-center justify-between flex-row-reverse">
        <div className="flex items-center gap-5 flex-row-reverse">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-black text-xl border border-indigo-100 shadow-inner">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div className="text-right">
            <div className="font-black text-slate-900 text-lg leading-tight mb-1">{user.full_name || 'موظف غير معرف'}</div>
            <div className="text-xs font-bold text-slate-400 tabular-nums tracking-wide">{user.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-row-reverse bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
          <select
            onChange={(e) => onUpdateRole(user.id, e.target.value)}
            defaultValue={currentRole || ""}
            className="h-10 min-w-36 border-none bg-transparent text-[11px] font-black focus:ring-0 text-primary"
          >
            <option value="">تغيير الصلاحية...</option>
            <option value="admin">المدير العام</option>
            <option value="facility_manager">مسؤول منشأة</option>
            <option value="technician">فني صيانة</option>
          </select>
          <div className="h-6 w-px bg-slate-200" />
          <button
            onClick={() => onDelete(user.id, user.full_name)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 hover:text-rose-500 hover:shadow-md transition-all border border-slate-100"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-300">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/10 border-t-primary" />
      <div className="text-sm font-black tracking-wide">{label}</div>
    </div>
  );
}

function NewRequestForm({ buildingId, onClose, onCreated, buildings }: any) {
  const [selectedBld, setSelectedBld] = useState(buildingId);
  const [facilityId, setFacilityId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [loading, setLoading] = useState(false);

  const { data: facilities = [] } = useQuery({
    queryKey: ["facilities", selectedBld],
    enabled: !!selectedBld,
    queryFn: async () => {
      const { data, error } = await supabase.from("facilities").select("id, name, category, facility_type").eq("building_id", selectedBld).order("category");
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedFac = facilities.find((f: any) => f.id === facilityId);

  const { data: estimate } = useQuery({
    queryKey: ["price", selectedFac?.facility_type],
    enabled: !!selectedFac?.facility_type,
    queryFn: async () => {
      const { data } = await supabase.from("price_catalog").select("standard_price").eq("facility_type", selectedFac!.facility_type).maybeSingle();
      return data?.standard_price ?? 0;
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("maintenance_requests").insert({
        building_id: selectedBld,
        facility_id: facilityId || null,
        title,
        description,
        priority,
        reported_by: auth.user?.id || "",
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
    <div className="glass-card bg-white p-0 shadow-2xl overflow-hidden text-right border-none">
      <div className="flex items-center justify-between border-b border-slate-100 px-10 py-8 bg-slate-50/50 flex-row-reverse">
        <div>
          <h3 className="text-2xl font-black text-slate-900 leading-none">فتح بلاغ صيانة</h3>
          <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">تعبئة بيانات العطل المكتشف</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-2xl bg-white p-3 text-slate-400 hover:text-rose-500 shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-8 p-10">
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-1">المبنى / الموقع</label>
            <select
              value={selectedBld}
              onChange={(e) => { setSelectedBld(e.target.value); setFacilityId(""); }}
              className="glass-input h-14 font-black text-sm"
              style={{ appearance: 'auto' }}
            >
              {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-1">المرفق المتضرر</label>
            <select
              required
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              className="glass-input h-14 font-black text-sm"
              style={{ appearance: 'auto' }}
            >
              <option value="">اختر المرفق...</option>
              {facilities.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-1">عنوان البلاغ</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="glass-input h-14 font-black text-sm" placeholder="مثال: عطل في مكيّف القاعة" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-1">مستوى الأولوية</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="glass-input h-14 font-black text-sm" style={{ appearance: 'auto' }}>
              <option value="low">عادية</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية (تتطلب تدخل)</option>
              <option value="urgent">طارئة جداً</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-1">وصف العطل بالتفصيل</label>
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="glass-input min-h-32 py-5 font-black text-sm leading-relaxed" placeholder="يرجى كتابة شرح مفصل للمشكلة لمساعدة الفني..." />
        </div>

        {selectedFac && (
          <div className="flex items-center justify-between rounded-3xl bg-indigo-50/50 p-8 border-2 border-indigo-100/50 flex-row-reverse">
            <div>
              <div className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">التكلفة المتوقعة</div>
              <div className="text-3xl font-black text-indigo-700 tabular-nums leading-none">{formatSAR(estimate ?? 0)}</div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
              <Wallet className="h-7 w-7" />
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4 flex-row-reverse">
          <button disabled={loading} className="btn-primary h-16 flex-1 text-lg font-black rounded-[1.25rem]">
            {loading ? "جارٍ الإرسال..." : "تأكيد وإرسال البلاغ"}
          </button>
          <button type="button" onClick={onClose} className="btn-outline h-16 px-12 rounded-[1.25rem] text-slate-400">إلغاء</button>
        </div>
      </form>
    </div>
  );
}

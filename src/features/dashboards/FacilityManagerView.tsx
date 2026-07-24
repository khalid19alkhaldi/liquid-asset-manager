import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BudgetBar } from "@/components/BudgetBar";
import { StatusPill, PriorityPill } from "@/components/StatusPill";
import { formatSAR, buildingTypeLabel } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Building2,
  AlertCircle,
  TrendingUp,
  ClipboardCheck,
  Clock,
  ArrowUpRight,
  Wallet,
  X,
  MapPin
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

export function FacilityManagerView({ profile }: { profile: any }) {
  const qc = useQueryClient();
  const building = profile?.building;
  const [showForm, setShowForm] = useState(false);

  const { data: requests = [] } = useQuery({
    queryKey: ["fm-requests", building?.id],
    enabled: !!building?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("*, facility:facilities(name, category)")
        .eq("building_id", building.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const spent = requests
    .filter((r: any) => r.status === "completed")
    .reduce((sum: number, r: any) => sum + Number(r.actual_cost ?? r.estimated_cost ?? 0), 0);

  const activeCount = requests.filter((r: any) => r.status !== 'completed' && r.status !== 'rejected').length;
  const completionRate = requests.length ? Math.round((requests.filter((r: any) => r.status === 'completed').length / requests.length) * 100) : 0;

  if (!building) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-500">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">لم يتم ربطك بمبنى بعد</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm font-medium text-slate-500 leading-relaxed">
            يرجى التواصل مع مدير الصيانة العام لتعيين دورك وربط حسابك بالمنشأة المخصصة لك للبدء في إدارة البلاغات.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* SaaS Executive Summary */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="بلاغات نشطة"
          value={activeCount}
          icon={TrendingUp}
          color="indigo"
          trend="يتطلب متابعة"
        />
        <MetricCard
          label="نسبة الإنجاز"
          value={`${completionRate}%`}
          icon={ClipboardCheck}
          color="emerald"
          trend="أداء متميز"
          isPositive={true}
        />
        <MetricCard
          label="الميزانية المستهلكة"
          value={`${Math.min(Math.round((spent / Number(building.annual_budget || 1)) * 100), 100)}%`}
          icon={Wallet}
          color="amber"
          trend="من المخصص السنوي"
        />
        <div className="glass-card p-6 flex flex-col justify-center bg-primary text-white border-none shadow-primary/20">
          <button
            onClick={() => setShowForm(true)}
            className="group flex flex-col items-center justify-center gap-2"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white transition-transform group-hover:scale-110">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-black tracking-tight">فتح بلاغ صيانة جديد</span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Building Identity Card */}
        <div className="lg:col-span-1">
          <div className="glass-card overflow-hidden h-full">
            <div className="h-32 bg-gradient-to-br from-primary to-primary/80 relative">
               <Building2 className="absolute -bottom-6 left-8 h-24 w-24 text-white/10" />
            </div>
            <div className="px-8 pb-8">
              <div className="-mt-10 mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl border border-slate-100">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-primary">{buildingTypeLabel(building.type)}</div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">{building.name}</h2>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-8">
                <MapPin className="h-3.5 w-3.5" />
                {building.location || "لم يتم تحديد الموقع بدقة"}
              </div>

              <div className="space-y-6 border-t border-slate-50 pt-8">
                <div>
                  <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase">
                    <span className="text-slate-400">حالة الميزانية</span>
                    <span className="text-primary">{formatSAR(spent)} مصروف</span>
                  </div>
                  <BudgetBar total={Number(building.annual_budget ?? 0)} spent={spent} label="" />
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">إجمالي المخصص</div>
                  <div className="text-xl font-black text-slate-900 leading-none tabular-nums">{formatSAR(building.annual_budget)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Feed */}
        <div className="lg:col-span-2 space-y-6 text-right">
          <div className="flex items-center justify-between">
            <h2 className="section-title">سجل العمليات الحية</h2>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Clock className="h-3.5 w-3.5" /> تيث من قاعدة البيانات
            </div>
          </div>

          <div className="space-y-4">
            {requests.map((r: any) => (
              <div key={r.id} className="glass-card p-6 group hover:shadow-xl transition-all border-r-4 border-r-primary/20 hover:border-r-primary">
                <div className="flex flex-wrap items-center justify-between gap-6 flex-row-reverse">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-3 flex-row-reverse">
                      <h3 className="text-lg font-black text-slate-900">{r.title}</h3>
                      <StatusPill status={r.status} />
                      <PriorityPill priority={r.priority} />
                    </div>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-2">{r.description}</p>
                    <div className="mt-4 flex gap-4 flex-row-reverse items-center text-[10px] font-black text-slate-400">
                      <span>{r.facility?.name}</span>
                      <div className="h-1 w-1 rounded-full bg-slate-200" />
                      <span className="tabular-nums">#{r.id.slice(0, 6)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">التكلفة</div>
                    <div className="text-xl font-black text-primary tabular-nums">{formatSAR(r.estimated_cost)}</div>
                  </div>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="rounded-3xl border-2 border-dashed border-slate-100 p-20 text-center">
                <Clock className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                <div className="font-bold text-slate-300 text-sm">لم يتم تسجيل أي بلاغات صيانة لهذا المبنى بعد.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md overflow-y-auto">
          <div className="my-auto w-full max-w-2xl animate-in zoom-in-95 duration-300">
            <NewRequestForm
              buildingId={building.id}
              onClose={() => setShowForm(false)}
              onCreated={() => {
                qc.invalidateQueries({ queryKey: ["fm-requests"] });
                setShowForm(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, trend, isPositive, color }: any) {
  const colors: any = {
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-600",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
    amber: "bg-amber-50 border-amber-100 text-amber-600",
  };

  return (
    <div className="glass-card p-6 group hover:shadow-xl transition-all">
      <div className="mb-6 flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-200 group-hover:text-primary transition-colors" />
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</div>
      <div className="text-3xl font-black text-slate-900 tabular-nums mb-3">{value}</div>
      <div className={`text-[10px] font-bold ${isPositive ? 'text-emerald-500' : 'text-slate-400'}`}>{trend}</div>
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
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("جلسة غير صالحة");
      const { error } = await supabase.from("maintenance_requests").insert({
        building_id: buildingId,
        facility_id: facilityId || null,
        title,
        description,
        priority,
        reported_by: uid,
        estimated_cost: estimate ?? 0,
      });
      if (error) throw error;
      toast.success("تم إرسال البلاغ بنجاح");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الإرسال");
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
          <div className="space-y-3 text-right">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-1">المرفق المتضرر</label>
            <select
              required
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              className="glass-input h-14 font-black text-sm"
              style={{ appearance: 'auto' }}
            >
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
          <div className="space-y-3 text-right">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-1">مستوى الأولوية</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="glass-input h-14 font-black text-sm" style={{ appearance: 'auto' }}>
              <option value="low">عادية</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية (تتطلب تدخل)</option>
              <option value="urgent">طارئة جداً</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 text-right">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-1">عنوان البلاغ</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="glass-input h-14 font-black text-sm" placeholder="مثال: عطل في مكيّف القاعة" />
        </div>

        <div className="space-y-3 text-right">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-1">وصف العطل بالتفصيل</label>
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="glass-input min-h-32 py-5 font-black text-sm leading-relaxed" placeholder="يرجى كتابة شرح مفصل للمشكلة لمساعدة الفني..." />
        </div>

        {selected && (
          <div className="flex items-center justify-between rounded-3xl bg-indigo-50/50 p-8 border-2 border-indigo-100/50 flex-row-reverse">
            <div>
              <div className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1 text-right">التكلفة المتوقعة</div>
              <div className="text-3xl font-black text-indigo-700 tabular-nums leading-none text-right">{formatSAR(estimate ?? 0)}</div>
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

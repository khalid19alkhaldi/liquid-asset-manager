import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { BudgetBar } from "@/components/BudgetBar";
import { StatusPill, PriorityPill } from "@/components/StatusPill";
import { formatSAR, buildingTypeLabel } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Filter, Plus } from "lucide-react";

export function AdminView() {
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

  const filtered = requests.filter((r: any) => {
    if (filterBuilding && r.building_id !== filterBuilding) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  async function update(id: string, patch: any) {
    const { error } = await supabase.from("maintenance_requests").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["all-requests"] });
    }
  }

  const totalBudget = buildings.reduce((s: number, b: any) => s + Number(b.annual_budget), 0);
  const totalSpent = requests
    .filter((r: any) => r.status === "completed")
    .reduce((s: number, r: any) => s + Number(r.actual_cost ?? r.estimated_cost ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <div className="text-xs text-muted-foreground">إجمالي المباني</div>
          <div className="mt-1 text-3xl font-bold text-gradient">{buildings.length}</div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs text-muted-foreground">إجمالي البلاغات</div>
          <div className="mt-1 text-3xl font-bold text-gradient">{requests.length}</div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs text-muted-foreground">قيد الانتظار</div>
          <div className="mt-1 text-3xl font-bold" style={{ color: "oklch(0.5 0.15 75)" }}>
            {requests.filter((r: any) => r.status === "pending").length}
          </div>
        </GlassCard>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-secondary">ميزانية الجمعية الإجمالية</h2>
        <BudgetBar total={totalBudget} spent={totalSpent} label="المجموع الكلي" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-secondary">المباني</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buildings.map((b: any) => {
            const bSpent = requests
              .filter((r: any) => r.building_id === b.id && r.status === "completed")
              .reduce((s: number, r: any) => s + Number(r.actual_cost ?? r.estimated_cost ?? 0), 0);
            const openCount = requests.filter((r: any) => r.building_id === b.id && r.status !== "completed").length;
            return (
              <GlassCard key={b.id} interactive onClick={() => {
                setSelectedBuildingId(b.id);
                setShowForm(true);
              }}>
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">{buildingTypeLabel(b.type)}</div>
                    <div className="font-bold text-secondary">{b.name}</div>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <BudgetBar total={Number(b.annual_budget)} spent={bSpent} label="الميزانية" />
                <div className="mt-2 text-xs text-muted-foreground">
                  البلاغات المفتوحة: <span className="font-bold text-primary">{openCount}</span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {showForm && selectedBuildingId && (
        <NewRequestForm
          buildingId={selectedBuildingId}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ["all-requests"] });
            setShowForm(false);
          }}
        />
      )}

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-secondary">جميع البلاغات</h2>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={filterBuilding} onChange={(e) => setFilterBuilding(e.target.value)} className="glass-input py-1.5 text-sm">
              <option value="">كل المباني</option>
              {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="glass-input py-1.5 text-sm">
              <option value="">كل الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="approved">معتمد</option>
              <option value="in_progress">جاري</option>
              <option value="completed">مكتمل</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3">
          {filtered.map((r: any) => (
            <GlassCard key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-secondary">{r.title}</h3>
                    <PriorityPill priority={r.priority} />
                    <StatusPill status={r.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>المبنى: <b className="text-secondary">{r.building?.name}</b></span>
                    {r.facility && <span>المرفق: <b className="text-secondary">{r.facility.name}</b></span>}
                    {r.reported_by && <span>بواسطة: <b className="text-secondary">{r.reported_by}</b></span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 min-w-40">
                  <div>
                    <label className="mb-0.5 block text-[10px] font-semibold text-muted-foreground">التكلفة التقديرية</label>
                    <input
                      type="number"
                      defaultValue={r.estimated_cost}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== Number(r.estimated_cost)) update(r.id, { estimated_cost: v });
                      }}
                      className="glass-input py-1 text-sm w-32"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.status === "pending" && (
                      <>
                        <button onClick={() => update(r.id, { status: "approved" })} className="btn-primary text-xs py-1 px-2">اعتماد</button>
                        <button onClick={() => update(r.id, { status: "rejected" })} className="btn-ghost text-xs py-1 px-2">رفض</button>
                      </>
                    )}
                    {r.status === "approved" && (
                      <button onClick={() => update(r.id, { status: "in_progress" })} className="btn-gold text-xs py-1 px-2">بدء</button>
                    )}
                    {r.status === "in_progress" && (
                      <button onClick={() => update(r.id, { status: "completed" })} className="btn-primary text-xs py-1 px-2">إكمال</button>
                    )}
                  </div>
                </div>
              </div>
              {r.actual_cost != null && (
                <div className="mt-2 text-xs text-muted-foreground">
                  التكلفة الفعلية: <span className="font-bold" style={{ color: "oklch(0.5 0.16 155)" }}>{formatSAR(r.actual_cost)}</span>
                </div>
              )}
            </GlassCard>
          ))}
          {filtered.length === 0 && (
            <GlassCard>
              <div className="py-6 text-center text-muted-foreground">لا توجد بلاغات مطابقة.</div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

function NewRequestForm({ buildingId, onClose, onCreated }: { buildingId: string; onClose: () => void; onCreated: () => void }) {
  const [facilityId, setFacilityId] = useState("");
  const [title, setTitle] = useState("");
  const [reportedBy, setReportedBy] = useState("");
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
      const { error } = await supabase.from("maintenance_requests").insert({
        building_id: buildingId,
        facility_id: facilityId || null,
        title,
        description,
        priority,
        reported_by: reportedBy || "مجهول",
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
    <GlassCard>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-secondary">بلاغ صيانة جديد</h3>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-secondary">إلغاء</button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-secondary">المرفق</label>
            <select required value={facilityId} onChange={(e) => setFacilityId(e.target.value)} className="glass-input">
              <option value="">اختر مرفقاً...</option>
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
          <div>
            <label className="mb-1 block text-xs font-semibold text-secondary">مقدم البلاغ (الاسم)</label>
            <input required value={reportedBy} onChange={(e) => setReportedBy(e.target.value)} className="glass-input" placeholder="اسمك الكريم" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-secondary">عنوان البلاغ</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="glass-input" placeholder="مثال: عطل في مكيّف الطابق الثاني" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-secondary">وصف العطل</label>
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="glass-input min-h-24" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-secondary">الأولوية</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="glass-input">
            <option value="low">منخفضة</option>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
            <option value="urgent">طارئة</option>
          </select>
        </div>

        {selected && (
          <div className="rounded-lg border border-[oklch(0.78_0.13_85/0.4)] bg-[oklch(0.78_0.13_85/0.1)] p-3">
            <div className="text-xs text-muted-foreground">التكلفة التقديرية</div>
            <div className="text-2xl font-bold" style={{ color: "oklch(0.5 0.13 85)" }}>{formatSAR(estimate ?? 0)}</div>
          </div>
        )}

        <button disabled={loading} className="btn-primary w-full">
          {loading ? "..." : "إرسال البلاغ"}
        </button>
      </form>
    </GlassCard>
  );
}

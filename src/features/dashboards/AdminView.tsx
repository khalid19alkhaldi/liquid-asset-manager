import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { BudgetBar } from "@/components/BudgetBar";
import { StatusPill, PriorityPill } from "@/components/StatusPill";
import { formatSAR, buildingTypeLabel } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Filter } from "lucide-react";

export function AdminView() {
  const qc = useQueryClient();
  const [filterBuilding, setFilterBuilding] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => (await supabase.from("buildings").select("*").order("name")).data ?? [],
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["all-requests"],
    queryFn: async () => (await supabase.from("maintenance_requests").select("*, building:buildings(name), facility:facilities(name)").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "technician");
      const ids = (roles ?? []).map((r: any) => r.user_id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      return data ?? [];
    },
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
        <h2 className="mb-3 text-lg font-bold text-secondary">المباني</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buildings.map((b: any) => {
            const bSpent = requests
              .filter((r: any) => r.building_id === b.id && r.status === "completed")
              .reduce((s: number, r: any) => s + Number(r.actual_cost ?? r.estimated_cost ?? 0), 0);
            const openCount = requests.filter((r: any) => r.building_id === b.id && r.status !== "completed").length;
            return (
              <GlassCard key={b.id} interactive>
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">{buildingTypeLabel(b.type)}</div>
                    <div className="font-bold text-secondary">{b.name}</div>
                  </div>
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
                  <div className="w-full">
                    <label className="mb-0.5 block text-[10px] font-semibold text-muted-foreground">تعيين فني</label>
                    <select
                      defaultValue={r.assigned_to ?? ""}
                      onChange={(e) => update(r.id, { assigned_to: e.target.value || null })}
                      className="glass-input py-1 text-sm w-32"
                    >
                      <option value="">—</option>
                      {technicians.map((t: any) => <option key={t.id} value={t.id}>{t.full_name ?? t.email}</option>)}
                    </select>
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

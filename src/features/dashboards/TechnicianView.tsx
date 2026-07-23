import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { StatusPill, PriorityPill } from "@/components/StatusPill";
import { formatSAR } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import { Wrench } from "lucide-react";

export function TechnicianView({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data: requests = [] } = useQuery({
    queryKey: ["tech-requests", userId],
    queryFn: async () => (await supabase
      .from("maintenance_requests")
      .select("*, building:buildings(name), facility:facilities(name)")
      .eq("assigned_to", userId)
      .order("created_at", { ascending: false })).data ?? [],
  });

  async function update(id: string, patch: any) {
    const { error } = await supabase.from("maintenance_requests").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["tech-requests"] });
    }
  }

  const active = requests.filter((r: any) => r.status !== "completed");
  const done = requests.filter((r: any) => r.status === "completed");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">مهام نشطة</div>
              <div className="text-2xl font-bold text-gradient">{active.length}</div>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs text-muted-foreground">مكتملة</div>
          <div className="mt-1 text-2xl font-bold" style={{ color: "oklch(0.5 0.16 155)" }}>{done.length}</div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs text-muted-foreground">إجمالي مصروف</div>
          <div className="mt-1 text-2xl font-bold text-primary">
            {formatSAR(done.reduce((s: number, r: any) => s + Number(r.actual_cost ?? 0), 0))}
          </div>
        </GlassCard>
      </div>

      <h2 className="text-lg font-bold text-secondary">مهامي</h2>
      {requests.length === 0 ? (
        <GlassCard>
          <div className="py-8 text-center text-muted-foreground">لا توجد مهام معيّنة لك حالياً.</div>
        </GlassCard>
      ) : (
        <div className="grid gap-3">
          {requests.map((r: any) => (
            <TechRow key={r.id} r={r} onUpdate={update} />
          ))}
        </div>
      )}
    </div>
  );
}

function TechRow({ r, onUpdate }: { r: any; onUpdate: (id: string, patch: any) => void }) {
  const [cost, setCost] = useState<string>(r.actual_cost?.toString() ?? "");
  const [notes, setNotes] = useState(r.technician_notes ?? "");

  return (
    <GlassCard>
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
            <span>تقديري: <b className="text-primary">{formatSAR(r.estimated_cost)}</b></span>
          </div>
        </div>
      </div>

      {r.status !== "completed" && (
        <div className="mt-4 space-y-2 border-t border-[oklch(0.9_0.02_200/0.6)] pt-3">
          {r.status === "approved" && (
            <button onClick={() => onUpdate(r.id, { status: "in_progress" })} className="btn-gold text-sm">بدء التنفيذ</button>
          )}
          {r.status === "in_progress" && (
            <div className="grid gap-2 md:grid-cols-3">
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="التكلفة الفعلية"
                className="glass-input md:col-span-1"
              />
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات الفني"
                className="glass-input md:col-span-1"
              />
              <button
                onClick={() =>
                  onUpdate(r.id, {
                    status: "completed",
                    actual_cost: Number(cost || 0),
                    technician_notes: notes,
                    completed_at: new Date().toISOString(),
                  })
                }
                className="btn-primary text-sm"
              >
                إغلاق البلاغ
              </button>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

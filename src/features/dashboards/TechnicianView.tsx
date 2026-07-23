import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { StatusPill, PriorityPill } from "@/components/StatusPill";
import { formatSAR } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ClipboardCheck } from "lucide-react";

export function TechnicianView({ userId }: { userId: string }) {
  const qc = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ["tech-requests", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("*, building:buildings(name), facility:facilities(name)")
        .eq("assigned_to", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function complete(id: string, notes: string, cost: number) {
    const { error } = await supabase
      .from("maintenance_requests")
      .update({
        status: "completed",
        technician_notes: notes,
        actual_cost: cost,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) toast.error(error.message);
    else {
      toast.success("تم إكمال العمل بنجاح");
      qc.invalidateQueries({ queryKey: ["tech-requests"] });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-secondary">المهام الموكلة إليك</h2>
        <div className="glass-panel px-3 py-1 text-xs font-semibold text-primary">
          {requests.filter((r: any) => r.status !== "completed").length} مهام نشطة
        </div>
      </div>

      <div className="grid gap-4">
        {requests.map((r: any) => (
          <TechRequestCard key={r.id} request={r} onComplete={complete} />
        ))}
        {requests.length === 0 && (
          <GlassCard>
            <div className="py-10 text-center text-muted-foreground">لا توجد مهام موكلة إليك حالياً.</div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

function TechRequestCard({ request, onComplete }: { request: any; onComplete: any }) {
  const [showComplete, setShowComplete] = useState(false);
  const [notes, setNotes] = useState("");
  const [cost, setCost] = useState(request.estimated_cost || 0);

  if (request.status === "completed") {
    return (
      <GlassCard className="opacity-75">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h3 className="font-bold text-secondary">{request.title}</h3>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground">{request.description}</p>
            <div className="mt-3 text-xs font-semibold text-secondary">ملاحظات الفني:</div>
            <p className="mt-1 text-xs text-muted-foreground italic">{request.technician_notes}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">التكلفة الفعلية</div>
            <div className="font-bold text-green-600">{formatSAR(request.actual_cost)}</div>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-secondary">{request.title}</h3>
            <PriorityPill priority={request.priority} />
            <StatusPill status={request.status} />
          </div>
          <p className="text-sm text-muted-foreground">{request.description}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>المبنى: <b className="text-secondary">{request.building?.name}</b></span>
            <span>المرفق: <b className="text-secondary">{request.facility?.name}</b></span>
          </div>
        </div>
        <button
          onClick={() => setShowComplete(!showComplete)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <ClipboardCheck className="h-4 w-4" />
          تحديث الحالة
        </button>
      </div>

      {showComplete && (
        <div className="mt-4 space-y-3 rounded-xl bg-slate-50/50 p-4 dark:bg-slate-800/50">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-secondary">التكلفة الفعلية (ريال)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="glass-input text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-secondary">ملاحظات العمل</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass-input min-h-20 text-sm"
                placeholder="ما الذي تم إنجازه؟"
              />
            </div>
          </div>
          <button
            onClick={() => onComplete(request.id, notes, cost)}
            className="btn-gold w-full py-2 text-sm"
          >
            إتمام المهمة وإغلاق البلاغ
          </button>
        </div>
      )}
    </GlassCard>
  );
}

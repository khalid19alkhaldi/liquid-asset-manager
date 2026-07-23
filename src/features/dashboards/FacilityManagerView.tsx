import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { BudgetBar } from "@/components/BudgetBar";
import { StatusPill, PriorityPill } from "@/components/StatusPill";
import { formatSAR, buildingTypeLabel } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Building2, AlertCircle } from "lucide-react";

// Loose type — Supabase types.ts is empty scaffold until re-generated.
type Profile = any;

export function FacilityManagerView({ profile }: { profile: Profile }) {
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

  if (!building) {
    return (
      <GlassCard>
        <div className="flex items-center gap-3 text-warning">
          <AlertCircle className="h-5 w-5" />
          <div>
            <div className="font-bold text-secondary">لم يتم ربطك بمبنى بعد</div>
            <div className="text-sm text-muted-foreground">تواصل مع مدير الصيانة العام لربطك بالمبنى المخصص.</div>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3">
        <div className="md:col-span-1">
          <GlassCard>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{buildingTypeLabel(building.type)}</div>
                <div className="font-bold text-secondary">{building.name}</div>
                {building.location && <div className="mt-1 text-xs text-muted-foreground">{building.location}</div>}
              </div>
            </div>
          </GlassCard>
        </div>
        <div className="md:col-span-2">
          <BudgetBar total={Number(building.annual_budget ?? 0)} spent={spent} label={`ميزانية ${building.name}`} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-secondary">بلاغات الصيانة</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> بلاغ جديد
        </button>
      </div>

      {showForm && (
        <NewRequestForm
          buildingId={building.id}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ["fm-requests"] });
            setShowForm(false);
          }}
        />
      )}

      {requests.length === 0 ? (
        <GlassCard>
          <div className="py-8 text-center text-muted-foreground">لا توجد بلاغات بعد.</div>
        </GlassCard>
      ) : (
        <div className="grid gap-3">
          {requests.map((r: any) => (
            <GlassCard key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-bold text-secondary">{r.title}</h3>
                    <PriorityPill priority={r.priority} />
                  </div>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                  {r.facility && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      المرفق: <span className="font-semibold text-secondary">{r.facility.name}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusPill status={r.status} />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">تقديري</div>
                    <div className="font-bold text-primary">{formatSAR(r.estimated_cost)}</div>
                  </div>
                  {r.actual_cost != null && (
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">فعلي</div>
                      <div className="font-bold" style={{ color: "oklch(0.5 0.16 155)" }}>{formatSAR(r.actual_cost)}</div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
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
    <GlassCard>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-secondary">بلاغ صيانة جديد</h3>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-secondary">إلغاء</button>
        </div>

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

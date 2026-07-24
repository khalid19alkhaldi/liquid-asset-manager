import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ClipboardCheck,
  Clock,
  Image as ImageIcon,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Upload
} from "lucide-react";
import { formatSAR } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import { StatusPill, PriorityPill } from "@/components/StatusPill";

export function ContractorPortal({ userId }: { userId: string }) {
  const qc = useQueryClient();

  const { data: assignments = [] } = useQuery({
    queryKey: ["contractor-tasks", userId],
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

  const stats = {
    pending: assignments.filter(a => a.status === 'assigned').length,
    in_progress: assignments.filter(a => a.status === 'in_progress').length,
    completed: assignments.filter(a => a.status === 'completed').length,
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Contractor Header Stats */}
      <div className="grid gap-6 sm:grid-cols-3">
        <PortalStatCard label="بانتظار البدء" val={stats.pending} icon={Clock} color="indigo" />
        <MetricIndicator label="جاري التنفيذ" val={stats.in_progress} icon={AlertTriangle} color="amber" />
        <MetricIndicator label="تم الإنجاز" val={stats.completed} icon={CheckCircle2} color="emerald" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="section-heading">أوامر العمل الموكلة</h2>
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
          مجموع المهام: {assignments.length}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {assignments.map((task: any) => (
          <ContractorTaskCard key={task.id} task={task} />
        ))}
        {assignments.length === 0 && (
          <div className="lg:col-span-2 rounded-[2.5rem] border-2 border-dashed border-slate-100 py-32 text-center">
            <ClipboardCheck className="mx-auto mb-4 h-12 w-12 text-slate-200" />
            <div className="font-bold text-slate-300">لا توجد أوامر عمل نشطة حالياً.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContractorTaskCard({ task }: any) {
  const [showAction, setShowAction] = useState(false);

  return (
    <div className="shq-card overflow-hidden group">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-300 tabular-nums border border-slate-100 px-2 py-0.5 rounded-lg">#{task.id.slice(0, 6)}</span>
            <StatusPill status={task.status} />
            <PriorityPill priority={task.priority} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">{task.title}</h3>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <span>{task.building?.name}</span>
            <div className="h-1 w-1 rounded-full bg-slate-200" />
            <span>{task.facility?.name}</span>
          </div>
        </div>
        <button
          onClick={() => setShowAction(!showAction)}
          className="btn-shq-primary h-12 w-12 p-0 rounded-2xl"
        >
          <Upload className="h-5 w-5" />
        </button>
      </div>

      <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">{task.description}</p>

      {showAction && (
        <div className="space-y-6 pt-6 border-t border-slate-50 animate-in zoom-in-95 duration-200">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border-2 border-dashed border-slate-100 p-8 text-center hover:border-primary/20 transition-colors cursor-pointer">
              <ImageIcon className="mx-auto mb-2 h-6 w-6 text-slate-300" />
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">صورة قبل التنفيذ</div>
            </div>
            <div className="rounded-2xl border-2 border-dashed border-slate-100 p-8 text-center hover:border-primary/20 transition-colors cursor-pointer">
              <ImageIcon className="mx-auto mb-2 h-6 w-6 text-slate-300" />
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">صورة بعد التنفيذ</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-1">ملاحظات الإنجاز</label>
            <textarea className="shq-input min-h-24 py-4 text-sm" placeholder="أدخل تفاصيل ما تم إنجازه..." />
          </div>

          <div className="flex gap-4">
            <button className="btn-shq-primary flex-1 h-14 rounded-2xl">إرسال لطلب الاعتماد</button>
            <button className="btn-shq-outline h-14 px-8 rounded-2xl">حفظ مسودة</button>
          </div>
        </div>
      )}

      {!showAction && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-black text-slate-900 tabular-nums">{formatSAR(task.estimated_cost)}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">ميزانية تقديرية</span>
          </div>
          <button className="text-xs font-black text-primary hover:underline">عرض التفاصيل</button>
        </div>
      )}
    </div>
  );
}

function PortalStatCard({ label, val, icon: Icon, color }: any) {
  const colors: any = { indigo: "text-indigo-600 bg-indigo-50 border-indigo-100" };
  return (
    <div className="shq-card p-8 border-b-4 border-b-primary">
      <div className={`mb-6 h-12 w-12 flex items-center justify-center rounded-2xl ${colors[color] || 'bg-slate-50 text-slate-400'}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</div>
      <div className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">{val}</div>
    </div>
  );
}

function MetricIndicator({ label, val, icon: Icon, color }: any) {
  const colors: any = {
    amber: "bg-amber-50 border-amber-100 text-amber-600",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600"
  };
  return (
    <div className="shq-card p-8">
      <div className={`mb-6 h-12 w-12 flex items-center justify-center rounded-2xl ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</div>
      <div className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">{val}</div>
    </div>
  );
}

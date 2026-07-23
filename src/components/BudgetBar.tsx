import { formatSAR } from "@/lib/format";

interface BudgetBarProps {
  total: number;
  spent: number;
  label?: string;
}

export function BudgetBar({ total, spent, label }: BudgetBarProps) {
  const pct = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
  const remaining = Math.max(0, total - spent);
  const barColor =
    pct > 85
      ? "linear-gradient(90deg, oklch(0.6 0.22 25), oklch(0.78 0.15 75))"
      : pct > 60
      ? "linear-gradient(90deg, oklch(0.78 0.15 75), oklch(0.78 0.13 85))"
      : "linear-gradient(90deg, oklch(0.55 0.11 185), oklch(0.72 0.13 185))";

  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-secondary">{label ?? "الميزانية السنوية"}</span>
        <span className="text-xs text-muted-foreground">{pct.toFixed(0)}% مصروف</span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-[oklch(0.9_0.02_200/0.6)] backdrop-blur">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: barColor, boxShadow: "0 0 12px oklch(0.55 0.11 185 / 0.4)" }}
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <div className="text-muted-foreground">الميزانية</div>
          <div className="font-bold text-secondary">{formatSAR(total)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">المصروف</div>
          <div className="font-bold text-primary">{formatSAR(spent)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">المتبقي</div>
          <div className="font-bold" style={{ color: "oklch(0.5 0.16 155)" }}>{formatSAR(remaining)}</div>
        </div>
      </div>
    </div>
  );
}

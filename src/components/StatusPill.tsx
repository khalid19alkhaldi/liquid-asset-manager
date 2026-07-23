import { statusLabel, priorityLabel } from "@/lib/format";

const statusStyles: Record<string, string> = {
  pending: "bg-[oklch(0.78_0.15_75/0.2)] text-[oklch(0.45_0.15_75)] border-[oklch(0.78_0.15_75/0.4)]",
  approved: "bg-[oklch(0.55_0.11_185/0.15)] text-primary border-[oklch(0.55_0.11_185/0.4)]",
  in_progress: "bg-[oklch(0.78_0.15_75/0.2)] text-[oklch(0.45_0.15_75)] border-[oklch(0.78_0.15_75/0.5)] animate-pulse",
  completed: "bg-[oklch(0.65_0.16_155/0.18)] text-[oklch(0.4_0.16_155)] border-[oklch(0.65_0.16_155/0.4)]",
  rejected: "bg-[oklch(0.6_0.22_25/0.15)] text-destructive border-[oklch(0.6_0.22_25/0.4)]",
};

const priorityStyles: Record<string, string> = {
  low: "bg-[oklch(0.65_0.16_155/0.15)] text-[oklch(0.4_0.16_155)]",
  medium: "bg-[oklch(0.55_0.11_185/0.15)] text-primary",
  high: "bg-[oklch(0.78_0.15_75/0.2)] text-[oklch(0.45_0.15_75)]",
  urgent: "bg-[oklch(0.6_0.22_25/0.18)] text-destructive",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status] ?? ""}`}>
      {statusLabel(status)}
    </span>
  );
}

export function PriorityPill({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityStyles[priority] ?? ""}`}>
      {priorityLabel(priority)}
    </span>
  );
}

import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 mx-auto mt-4 w-[calc(100%-1.5rem)] max-w-7xl">
      <div className="glass-panel flex items-center justify-between gap-4 px-5 py-3">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)", boxShadow: "0 4px 16px -4px oklch(0.55 0.11 185 / 0.5)" }}>
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-secondary leading-tight">جمعية الجبيل</div>
            <div className="text-xs text-muted-foreground">بوابة إدارة وصيانة الأصول</div>
          </div>
        </Link>
      </div>
    </header>
  );
}

import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, ShieldCheck } from "lucide-react";
import { roleLabel } from "@/lib/format";

interface AppHeaderProps {
  userName?: string | null;
  role?: string | null;
}

export function AppHeader({ userName, role }: AppHeaderProps) {
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 mx-auto mt-4 w-[calc(100%-1.5rem)] max-w-7xl">
      <div className="glass-panel flex items-center justify-between gap-4 px-5 py-3">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)", boxShadow: "0 4px 16px -4px oklch(0.55 0.11 185 / 0.5)" }}>
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-secondary leading-tight">جمعية الجبيل</div>
            <div className="text-xs text-muted-foreground">بوابة إدارة وصيانة الأصول</div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {userName && (
            <div className="hidden text-left sm:block">
              <div className="text-sm font-semibold text-secondary">{userName}</div>
              {role && <div className="text-xs text-muted-foreground">{roleLabel(role)}</div>}
            </div>
          )}
          <button onClick={handleSignOut} className="btn-ghost flex items-center gap-1.5 text-sm">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
}

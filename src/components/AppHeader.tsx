import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, ShieldCheck, User } from "lucide-react";
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
      <div className="glass-panel flex items-center justify-between gap-4 border border-white/40 bg-white/70 px-5 py-3 shadow-lg backdrop-blur-lg dark:border-slate-800/50 dark:bg-slate-900/80">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-slate-900 leading-tight dark:text-white">جمعية الجبيل</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">بوابة إدارة الأصول</div>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {userName ? (
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4 dark:border-slate-700">
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{userName}</div>
                {role && <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">{roleLabel(role)}</div>}
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          ) : null}

          <button
            onClick={handleSignOut}
            className="group flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
            title="تسجيل الخروج"
          >
            <LogOut className="h-5 w-5 text-slate-400 transition-colors group-hover:text-red-500" />
          </button>
        </div>
      </div>
    </header>
  );
}

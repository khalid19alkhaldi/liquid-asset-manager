import { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building2,
  LogOut,
  ShieldCheck,
  ChevronLeft
} from "lucide-react";
import { roleLabel } from "@/lib/format";

interface DashboardLayoutProps {
  children: ReactNode;
  userName?: string | null;
  role?: string | null;
}

export function DashboardLayout({ children, userName, role }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const navItems = [
    { id: "stats", label: "لوحة التحكم", icon: LayoutDashboard, path: "/dashboard" },
    { id: "requests", label: "بلاغات الصيانة", icon: ClipboardList, path: "/dashboard" }, // Can be filtered via state in AdminView
    { id: "users", label: "إدارة الموظفين", icon: Users, path: "/dashboard", adminOnly: true },
    { id: "buildings", label: "المباني والمرافق", icon: Building2, path: "/dashboard" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed right-0 top-0 z-50 h-screen w-72 bg-primary shadow-2xl transition-all dark:bg-slate-900">
        <div className="flex h-full flex-col">
          {/* Logo Area */}
          <div className="flex items-center gap-4 px-8 py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner backdrop-blur-md">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="text-white">
              <div className="text-lg font-black leading-tight">جمعية الجبيل</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">بوابة إدارة الأصول</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4">
            {navItems.map((item) => {
              if (item.adminOnly && role !== "admin") return null;

              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path as any}
                  className={`flex items-center justify-between rounded-xl px-4 py-3.5 transition-all group ${
                    isActive
                      ? "bg-white/10 text-white shadow-lg"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-5 w-5 ${isActive ? "text-gold" : "opacity-60 group-hover:opacity-100"}`} />
                    <span className="text-sm font-bold">{item.label}</span>
                  </div>
                  {isActive && <ChevronLeft className="h-4 w-4 text-gold" />}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Summary */}
          <div className="m-4 rounded-2xl bg-black/10 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-white font-black shadow-lg">
                {userName?.charAt(0) || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black text-white">{userName}</div>
                <div className="text-[10px] font-bold text-white/50 uppercase tracking-tighter">{role ? roleLabel(role) : ""}</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-xs font-bold text-white transition-all hover:bg-destructive/80 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="mr-72 min-w-0 flex-1 p-8 lg:p-12">
        <header className="mb-10 flex items-end justify-between border-b border-slate-200 pb-6 dark:border-slate-800">
          <div>
            <div className="mb-1 text-sm font-bold text-primary dark:text-emerald-400">مرحباً بك مجدداً</div>
            <h1 className="text-3xl font-black text-secondary dark:text-white">نظرة عامة على الأصول</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-left">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">التاريخ الحالي</div>
              <div className="text-sm font-bold text-secondary dark:text-white">
                {new Intl.DateTimeFormat('ar-SA', { dateStyle: 'full' }).format(new Date())}
              </div>
            </div>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  );
}

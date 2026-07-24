import { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building2,
  LogOut,
  ShieldCheck,
  ChevronLeft,
  Bell,
  Search,
  Command
} from "lucide-react";
import { roleLabel } from "@/lib/format";

interface DashboardLayoutProps {
  children: ReactNode;
  userName?: string | null;
  role?: string | null;
  activeTab: string;
  onTabChange: (tab: any) => void;
}

export function DashboardLayout({ children, userName, role, activeTab, onTabChange }: DashboardLayoutProps) {
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const navItems = [
    { id: "stats", label: "نظرة عامة", icon: LayoutDashboard },
    { id: "requests", label: "البلاغات النشطة", icon: ClipboardList },
    { id: "users", label: "الموظفين", icon: Users, adminOnly: true },
    { id: "buildings", label: "الأصول والمرافق", icon: Building2 },
  ];

  return (
    <div className="flex min-h-screen bg-[#fcfcfc] dark:bg-slate-950 font-sans">
      {/* Sidebar - Modern White Glass */}
      <aside className="fixed right-0 top-0 z-50 h-screen w-80 glass-sidebar transition-all overflow-y-auto">
        <div className="flex h-full flex-col px-6 py-8">
          {/* Brand Identity */}
          <div className="mb-12 flex items-center gap-4 pr-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-2xl shadow-primary/20 transition-transform hover:scale-105">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 leading-none tracking-tight">جمعية الجبيل</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">نظام إدارة الأصول</div>
            </div>
          </div>

          {/* Quick Search Widget */}
          <div className="relative mb-8 px-2">
            <div className="flex items-center gap-2 rounded-2xl bg-slate-100/50 p-3 text-slate-400 transition-all hover:bg-slate-100">
              <Search className="h-4 w-4" />
              <span className="flex-1 text-xs font-bold">بحث سريع...</span>
              <div className="flex items-center gap-1 rounded-lg bg-white px-1.5 py-0.5 text-[9px] font-black border border-slate-200">
                <Command className="h-2.5 w-2.5" />
                K
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2 text-right">
            <div className="mb-4 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">القائمة الرئيسية</div>
            {navItems.map((item) => {
              if (item.adminOnly && role !== "admin") return null;

              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex w-full items-center justify-between rounded-[1.25rem] px-4 py-4 transition-all group ${
                    isActive
                      ? "bg-primary text-white shadow-xl shadow-primary/20"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${isActive ? "bg-white/20" : "bg-slate-100/50 group-hover:bg-white"}`}>
                      <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-primary"}`} />
                    </div>
                    <span className="text-sm font-black tracking-tight">{item.label}</span>
                  </div>
                  {isActive && <ChevronLeft className="h-4 w-4 text-white/50" />}
                </button>
              );
            })}
          </nav>

          {/* SaaS User Profile Widget */}
          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-black shadow-inner border border-indigo-100/50">
                  {userName?.charAt(0) || "U"}
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div className="truncate text-xs font-black text-slate-900">{userName}</div>
                  <div className="mt-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-tight">{roleLabel(role)}</div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="mr-80 min-w-0 flex-1 p-8 lg:p-14 text-right">
        {/* Modern SaaS Top Bar */}
        <header className="mb-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <div className="mb-2 text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                مباشر الآن
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                {navItems.find(i => i.id === activeTab)?.label || "لوحة التحكم"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 p-2 shadow-sm">
              <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-primary transition-all relative">
                <Bell className="h-5 w-5" />
                <div className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white" />
              </button>
              <div className="h-6 w-px bg-slate-100" />
              <div className="px-4 py-1 text-left">
                <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">توقيت الرياض</div>
                <div className="text-[11px] font-bold text-slate-900 tabular-nums">
                  {new Intl.DateTimeFormat('ar-SA', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out">
          {children}
        </div>
      </main>
    </div>
  );
}

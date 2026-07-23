import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, UserPlus, LogIn, Mail, Lock, User, Building, Wrench } from "lucide-react";
import { roleLabel } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "بوابة جمعية الجبيل — الدخول" },
      { name: "description", content: "سجل دخولك لإدارة أصول وصيانة جمعية الجبيل." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"facility_manager" | "technician">("facility_manager");
  const [buildingId, setBuildingId] = useState<string>("");
  const [buildings, setBuildings] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/dashboard", replace: true });
    });

    // Fetch buildings for signup
    supabase.from("buildings").select("id, name").order("name").then(({ data }) => {
      if (data) {
        setBuildings(data);
        if (data[0]) setBuildingId(data[0].id);
      }
    });
  }, [nav]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
              assigned_building_id: role === "facility_manager" ? buildingId : null
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          toast.success("تم إنشاء الحساب بنجاح! جاري توجيهك...");
          nav({ to: "/dashboard", replace: true });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("مرحباً بعودتك إلى المنصة");
        nav({ to: "/dashboard", replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-lg">
        {/* Logo Section */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-indigo-600 shadow-xl shadow-indigo-200 dark:shadow-none">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">جمعية الجبيل الخيرية</h1>
          <p className="mt-2 font-medium text-slate-500">منظومة إدارة الأصول الرقمية</p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel overflow-hidden border border-white/50 bg-white/80 p-2 shadow-2xl backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900/80">
          {/* Mode Switcher */}
          <div className="flex gap-1 rounded-2xl bg-slate-100/50 p-1 dark:bg-slate-800/50">
            <button
              onClick={() => setMode("signin")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all ${
                mode === "signin"
                  ? "bg-white text-indigo-600 shadow-md dark:bg-slate-700 dark:text-indigo-300"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LogIn className="h-4 w-4" />
              تسجيل دخول
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all ${
                mode === "signup"
                  ? "bg-white text-indigo-600 shadow-md dark:bg-slate-700 dark:text-indigo-300"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              حساب جديد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6 pt-8">
            {mode === "signup" && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 pr-1">
                  <User className="h-3 w-3" /> الاسم الكامل
                </label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="glass-input h-12 w-full px-5 text-sm"
                  placeholder="محمد بن فهد الرويلي"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 pr-1">
                <Mail className="h-3 w-3" /> البريد الإلكتروني
              </label>
              <input
                required
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input h-12 w-full px-5 text-sm"
                placeholder="name@jubail.org"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 pr-1">
                <Lock className="h-3 w-3" /> كلمة المرور
              </label>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input h-12 w-full px-5 text-sm"
                placeholder="••••••••"
              />
            </div>

            {mode === "signup" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 pr-1">
                    <Wrench className="h-3 w-3" /> نوع الدور
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="glass-input h-12 w-full px-3 text-sm"
                  >
                    <option value="facility_manager">{roleLabel("facility_manager")}</option>
                    <option value="technician">{roleLabel("technician")}</option>
                  </select>
                </div>

                {role === "facility_manager" && (
                  <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 pr-1">
                      <Building className="h-3 w-3" /> المبنى المخصص
                    </label>
                    <select
                      value={buildingId}
                      onChange={(e) => setBuildingId(e.target.value)}
                      className="glass-input h-12 w-full px-3 text-sm"
                    >
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="group relative mt-6 h-14 w-full overflow-hidden rounded-2xl bg-indigo-600 font-black text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-[0.98] dark:shadow-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>جارٍ المعالجة...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>{mode === "signin" ? "دخول المنصة" : "تفعيل الحساب الجديد"}</span>
                  <ShieldCheck className="h-5 w-5 opacity-50 group-hover:opacity-100" />
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-12 space-y-4 text-center">
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="h-px w-10 bg-slate-200" />
            جمعية الجبيل الخيرية
            <span className="h-px w-10 bg-slate-200" />
          </div>
          <p className="text-[10px] leading-relaxed text-slate-400">
            هذه المنصة مخصصة لموظفي الجمعية وفنيي الصيانة المعتمدين فقط.<br />
            جميع العمليات مسجلة وخاضعة لسياسة الخصوصية والأمان.
          </p>
        </div>
      </div>
    </div>
  );
}

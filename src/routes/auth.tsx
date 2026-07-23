import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, UserPlus, LogIn } from "lucide-react";
import { roleLabel } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — بوابة جمعية الجبيل" },
      { name: "description", content: "الدخول الآمن إلى بوابة إدارة وصيانة أصول جمعية الجبيل." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"facility_manager" | "technician">("facility_manager");
  const [buildings, setBuildings] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [buildingId, setBuildingId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/dashboard", replace: true });
    });

    supabase.from("buildings").select("id, name, type").order("name").then(({ data }) => {
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

        toast.success("تم إنشاء الحساب بنجاح");
        nav({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("مرحباً بعودتك");
        nav({ to: "/dashboard", replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء العملية");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg shadow-indigo-200">
            <ShieldCheck className="h-8 w-8 text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">جمعية الجبيل الخيرية</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">بوابة إدارة وصيانة الأصول</p>
        </div>

        <div className="glass-panel overflow-hidden border border-white/40 bg-white/70 p-1 shadow-2xl backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50">
          <div className="flex p-1">
            <button
              onClick={() => setMode("signin")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                mode === "signin"
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              <LogIn className="h-4 w-4" />
              تسجيل الدخول
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                mode === "signup"
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              إنشاء حساب
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-5">
            {mode === "signup" && (
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">الاسم الكامل</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="glass-input h-11 w-full border-slate-200 bg-slate-50/50 px-4 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="أدخل اسمك الثلاثي"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">البريد الإلكتروني</label>
              <input
                required
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input h-11 w-full border-slate-200 bg-slate-50/50 px-4 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">كلمة المرور</label>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input h-11 w-full border-slate-200 bg-slate-50/50 px-4 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="••••••••"
              />
            </div>

            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">نوع الدور</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="glass-input h-11 w-full border-slate-200 bg-slate-50/50 px-3 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="facility_manager">{roleLabel("facility_manager")}</option>
                    <option value="technician">{roleLabel("technician")}</option>
                  </select>
                </div>
                {role === "facility_manager" && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">المبنى</label>
                    <select
                      value={buildingId}
                      onChange={(e) => setBuildingId(e.target.value)}
                      className="glass-input h-11 w-full border-slate-200 bg-slate-50/50 px-3 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-[0.98] disabled:opacity-50 dark:shadow-none"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : mode === "signin" ? (
                "دخول المنصة"
              ) : (
                "إنشاء الحساب"
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          بالدخول إلى المنصة، أنت توافق على شروط الاستخدام وسياسة الخصوصية <br />
          الخاصة بجمعية الجبيل الخيرية.
        </p>
      </div>
    </div>
  );
}

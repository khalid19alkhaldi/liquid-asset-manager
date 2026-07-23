import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { roleLabel } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — بوابة جمعية الجبيل" },
      { name: "description", content: "الدخول إلى بوابة إدارة وصيانة أصول جمعية الجبيل." },
      { property: "og:title", content: "تسجيل الدخول — بوابة جمعية الجبيل" },
      { property: "og:description", content: "الدخول إلى بوابة إدارة وصيانة الأصول." },
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
  const [role, setRole] = useState<"facility_manager" | "admin" | "technician">("facility_manager");
  const [buildings, setBuildings] = useState<Array<{ id: string; name: string }>>([]);
  const [buildingId, setBuildingId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/dashboard", replace: true });
    });
    // Fetch buildings with error logging
    supabase.from("buildings").select("id, name").order("name").then(({ data, error }) => {
      if (error) {
        console.error("Error fetching buildings:", error);
        toast.error("خطأ في تحميل قائمة المباني");
      }
      if (data) {
        setBuildings(data);
        if (data[0]) setBuildingId(data[0].id);
      }
    });
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;

        const uid = data.user?.id;
        if (uid) {
          // Attempt to assign role but don't crash if trigger already handled it
          try {
            await supabase.from("user_roles").insert({ user_id: uid, role }).select().single();
            if (role === "facility_manager" && buildingId) {
              await supabase.from("profiles").update({ assigned_building_id: buildingId, full_name: fullName }).eq("id", uid);
            } else {
              await supabase.from("profiles").update({ full_name: fullName }).eq("id", uid);
            }
          } catch (roleError) {
            console.log("Role might have been assigned by trigger:", roleError);
          }
        }

        if (data.session) {
          toast.success("تم إنشاء الحساب بنجاح");
          nav({ to: "/dashboard", replace: true });
        } else {
          toast.info("تم إنشاء الحساب. يرجى التحقق من بريدك الإلكتروني لتفعيله، أو تسجيل الدخول إذا كان التفعيل معطلاً.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("مرحباً بعودتك");
        nav({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-secondary leading-tight">جمعية الجبيل</div>
            <div className="text-xs text-muted-foreground">بوابة إدارة الأصول</div>
          </div>
        </Link>

        <div className="glass-panel p-7">
          <div className="mb-5 flex rounded-lg bg-[oklch(0.9_0.02_200/0.5)] p-1 backdrop-blur">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                  mode === m ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
                }`}
              >
                {m === "signin" ? "تسجيل دخول" : "حساب جديد"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-secondary">الاسم الكامل</label>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="glass-input" />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold text-secondary">البريد الإلكتروني</label>
              <input required type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-secondary">كلمة المرور</label>
              <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="glass-input" />
            </div>

            {mode === "signup" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-secondary">الدور</label>
                  <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="glass-input">
                    <option value="facility_manager">{roleLabel("facility_manager")}</option>
                    <option value="admin">{roleLabel("admin")}</option>
                    <option value="technician">{roleLabel("technician")}</option>
                  </select>
                </div>
                {role === "facility_manager" && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-secondary">المبنى المخصص</label>
                    <select value={buildingId} onChange={(e) => setBuildingId(e.target.value)} className="glass-input">
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <button disabled={loading} className="btn-primary w-full">
              {loading ? "..." : mode === "signin" ? "دخول" : "إنشاء الحساب"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            بالدخول أنت توافق على استخدام البوابة وفق سياسات جمعية الجبيل.
          </p>
        </div>
      </div>
    </div>
  );
}

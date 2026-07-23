import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ClipboardList, ShieldCheck, Wallet2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "بوابة إدارة وصيانة أصول جمعية الجبيل" },
      { name: "description", content: "منظومة رقمية فاخرة لإدارة بلاغات الصيانة، التسعير التلقائي ومتابعة ميزانيات المباني في جمعية الجبيل." },
      { property: "og:title", content: "بوابة إدارة وصيانة أصول جمعية الجبيل" },
      { property: "og:description", content: "منظومة رقمية فاخرة لإدارة بلاغات الصيانة، التسعير التلقائي ومتابعة ميزانيات المباني في جمعية الجبيل." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <nav className="mx-auto mt-4 w-[calc(100%-1.5rem)] max-w-7xl">
        <div className="glass-panel flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-secondary leading-tight">جمعية الجبيل</div>
              <div className="text-xs text-muted-foreground">HQ Jubail Portal</div>
            </div>
          </div>
          <Link to="/auth" className="btn-primary text-sm">دخول المنصة</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 pt-16 pb-24">
        <section className="text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[oklch(0.78_0.13_85/0.4)] bg-[oklch(0.78_0.13_85/0.1)] px-4 py-1.5 text-xs font-semibold text-[oklch(0.5_0.13_85)] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            منصة الصيانة الذكية لأصول الجمعية
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-secondary sm:text-6xl">
            إدارة صيانة أصول <span className="text-gradient">جمعية الجبيل</span>
            <br />بواجهة زجاجية فاخرة
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            بوابة موحّدة لتقديم بلاغات الصيانة، حساب التكلفة التقديرية آلياً، ومتابعة الميزانيات لكل مبنى ومرفق تابع للجمعية.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" className="btn-primary">ابدأ الآن</Link>
            <a href="#features" className="btn-ghost">استعراض المزايا</a>
          </div>
        </section>

        <section id="features" className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Building2, title: "5 مبانٍ رئيسية", desc: "الإدارة، المدرسة، السكن، المستودع، والمكاتب الفرعية" },
            { icon: ClipboardList, title: "بلاغات لحظية", desc: "تتبع حالة كل بلاغ من الطلب حتى الإكمال" },
            { icon: Wallet2, title: "تسعير تلقائي", desc: "حساب التكلفة التقديرية من دليل الأسعار المعتمد" },
            { icon: ShieldCheck, title: "صلاحيات محكمة", desc: "3 أدوار: مسؤول منشأة، مدير عام، وفني صيانة" },
          ].map((f) => (
            <div key={f.title} className="glass-card glass-card-hover p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--gradient-primary)" }}>
                <f.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold text-secondary">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-20">
          <div className="glass-panel p-10 text-center">
            <h2 className="text-3xl font-bold text-secondary">جاهز للبدء؟</h2>
            <p className="mt-3 text-muted-foreground">أنشئ حسابك الآن وابدأ بإدارة أصولك بكل سهولة.</p>
            <div className="mt-6">
              <Link to="/auth" className="btn-gold">الدخول للمنصة</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-6 pb-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} جمعية الجبيل — بوابة إدارة وصيانة الأصول
      </footer>
    </div>
  );
}

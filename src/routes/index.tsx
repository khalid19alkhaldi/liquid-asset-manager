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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-black text-secondary leading-tight">جمعية الجبيل الخيرية</div>
              <div className="text-[10px] font-bold text-primary uppercase tracking-widest">بوابة إدارة الأصول</div>
            </div>
          </div>
          <Link to="/auth" className="btn-primary text-xs px-8">دخول الموظفين</Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_50%,rgba(0,90,52,0.05)_0%,transparent_100%)]" />
          <div className="mx-auto max-w-7xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 text-xs font-black text-primary border border-primary/10">
              <Sparkles className="h-3.5 w-3.5" />
              المنظومة الرقمية المتكاملة للصيانة
            </div>
            <h1 className="mx-auto max-w-4xl text-5xl font-black leading-[1.1] text-secondary sm:text-7xl">
              إدارة صيانة أصول <br />
              <span className="text-primary">جمعية الجبيل الخيرية</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg font-medium text-slate-500 leading-relaxed">
              بوابة مؤسسية موحدة لمتابعة بلاغات الصيانة، إدارة الميزانيات السنوية، والتحكم الرقمي الشامل بجميع مرافق ومنشآت الجمعية.
            </p>
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Link to="/auth" className="btn-primary h-14 px-10 text-base">ابدأ الآن</Link>
              <a href="#features" className="btn-outline h-14 px-10 text-base">استعراض المزايا</a>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="bg-slate-50 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-black text-secondary">خدمات المنصة</h2>
              <div className="mx-auto mt-4 h-1.5 w-20 rounded-full bg-primary" />
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Building2, title: "إدارة المرافق", desc: "ربط رقمي شامل لجميع مباني الجمعية، المدرسة، والسكن." },
                { icon: ClipboardList, title: "نظام البلاغات", desc: "تتبع ذكي لكل بلاغ صيانة من مرحلة الرفع حتى الإنجاز." },
                { icon: Wallet2, title: "التحكم المالي", desc: "متابعة الميزانيات المخصصة لكل مبنى وتقارير الصرف." },
                { icon: ShieldCheck, title: "أمن البيانات", desc: "صلاحيات محكمة تضمن خصوصية وسرية العمليات الإدارية." },
              ].map((f) => (
                <div key={f.title} className="inst-card p-8 bg-white hover:-translate-y-2 transition-transform">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                    <f.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-black text-secondary">{f.title}</h3>
                  <p className="mt-3 text-sm font-medium text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <div className="rounded-[3rem] bg-secondary p-12 lg:p-20 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-64 w-64 bg-primary/20 blur-[100px]" />
              <h2 className="relative text-3xl font-black sm:text-5xl">جاهز لتحويل الإدارة رقمياً؟</h2>
              <p className="relative mx-auto mt-6 max-w-xl text-lg text-slate-300">
                أنشئ حسابك الآن كموظف أو فني معتمد للبدء في استخدام كافة أدوات المنصة.
              </p>
              <div className="relative mt-10">
                <Link to="/auth" className="btn-gold h-14 px-12 text-base">تسجيل الدخول للمنصة</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm font-bold text-slate-400 leading-relaxed">
            © {new Date().getFullYear()} جميع الحقوق محفوظة — الجمعية الخيرية لتحفيظ القرآن الكريم بالجبيل
          </p>
        </div>
      </footer>
    </div>
  );
}
      </main>

      <footer className="mx-auto max-w-7xl px-6 pb-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} جمعية الجبيل — بوابة إدارة وصيانة الأصول
      </footer>
    </div>
  );
}

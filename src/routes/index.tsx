import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  ClipboardList,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Users2,
  HardHat,
  ChevronLeft,
  CalendarCheck,
  Zap,
  Layout
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "المنصة الرقمية المتكاملة — جمعية تحفيظ الجبيل (SHQ)" },
      { name: "description", content: "بوابة إدارة الأصول وصيانة المرافق والتشغيل الذكي لجمعية تحفيظ القرآن بالجبيل." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Header Navigation */}
      <header className="fixed top-0 z-[100] w-full bg-white/80 backdrop-blur-xl border-b border-slate-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 h-20">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.25rem] bg-primary text-white shadow-xl shadow-primary/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-slate-900 leading-none">SHQ Jubail</div>
              <div className="mt-1 text-[9px] font-bold text-primary uppercase tracking-widest">Digital Asset Management</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {["المزايا", "آلية العمل", "البوابات", "المقاولون"].map(item => (
              <a key={item} href="#" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">{item}</a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/auth" className="text-sm font-black text-slate-900 px-6 py-2 hover:bg-slate-50 rounded-xl transition-colors">دخول الموظفين</Link>
            <Link to="/auth" className="btn-shq-primary text-xs h-10 px-6 shadow-none">اطلب عرضًا</Link>
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative px-6 pt-24 pb-32 text-center lg:pt-36 lg:pb-48 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-full max-w-4xl bg-primary/5 rounded-full blur-[120px] -z-10 opacity-60" />

          <div className="mx-auto max-w-5xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-xs font-black text-primary border border-primary/20 shadow-sm animate-bounce">
              <Sparkles className="h-4 w-4" />
              أتمتة ذكية لأصول الجمعية
            </div>

            <h1 className="text-5xl font-black leading-[1.1] text-slate-900 sm:text-8xl tracking-tight">
              كفاءة تشغيلية <br />
              <span className="text-primary italic">عالية المستوى</span>
            </h1>

            <p className="mx-auto mt-10 max-w-2xl text-xl font-medium text-slate-500 leading-relaxed">
              منصة موحدة لإدارة صيانة 18 منشأة، تتبع المقاولين، وجدولة الصيانة الوقائية <br className="hidden md:block" /> لضمان استدامة أصول جمعية تحفيظ الجبيل.
            </p>

            <div className="mt-14 flex flex-wrap justify-center gap-6">
              <Link to="/auth" className="btn-shq-primary h-16 px-12 text-base rounded-2xl">
                ابدأ رحلة التحول الرقمي
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <button className="btn-shq-outline h-16 px-12 text-base rounded-2xl">استعراض البوابات</button>
            </div>
          </div>
        </section>

        {/* Workflow Section (The Steps) */}
        <section className="bg-slate-50 py-32 border-y border-slate-100">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-20 text-center">
              <h2 className="section-heading">آلية عمل البلاغات</h2>
              <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">من البلاغ إلى الاعتماد النهائي</p>
            </div>

            <div className="grid gap-12 lg:grid-cols-4 relative">
              <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 hidden lg:block -z-0" />
              {[
                { n: "01", t: "رفع البلاغ", d: "تصوير العطل عبر الجوال وتحديد الموقع بدقة.", icon: Zap },
                { n: "02", t: "التوجيه الذكي", d: "إرسال التكليف للمقاول المختص آلياً.", icon: ArrowRight },
                { n: "03", t: "التنفيذ والتوثيق", d: "رفع صور الإنجاز وقطع الغيار المستخدمة.", icon: CalendarCheck },
                { n: "04", t: "الاعتماد المالي", d: "مراجعة الجودة وإغلاق الطلب وفلترة الفواتير.", icon: Layout },
              ].map((step) => (
                <div key={step.n} className="relative z-10 flex flex-col items-center text-center group">
                  <div className="mb-8 stepper-circle bg-white border-4 border-slate-50 shadow-xl group-hover:bg-primary group-hover:text-white group-hover:scale-110">
                    {step.n}
                  </div>
                  <h3 className="mb-3 text-xl font-black text-slate-900">{step.t}</h3>
                  <p className="text-sm font-medium text-slate-400 leading-relaxed px-4">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Impact Stats Section */}
        <section className="py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-8 lg:grid-cols-3">
              {[
                { label: "متوسط وقت الاستجابة", val: "42 دقيقة", trend: "↓ 12%", icon: Zap },
                { label: "نسبة إنجاز المهام", val: "98.4%", trend: "↑ 5.2%", icon: ClipboardList },
                { label: "أوامر عمل نشطة", val: "1,240+", trend: "شهرياً", icon: Building2 },
              ].map((stat) => (
                <div key={stat.label} className="shq-card p-10 group overflow-hidden relative">
                  <stat.icon className="absolute -right-4 -bottom-4 h-24 w-24 text-slate-50 group-hover:text-primary/5 transition-colors" />
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">{stat.label}</div>
                  <div className="text-4xl font-black text-slate-900 mb-2 tabular-nums">{stat.val}</div>
                  <div className="text-xs font-bold text-emerald-500">{stat.trend}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dual Portals Section */}
        <section className="pb-48 pt-12 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-2">
              {/* Employee Portal Card */}
              <div className="group rounded-[3rem] bg-slate-900 p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between h-[450px]">
                <div className="absolute top-0 right-0 h-64 w-64 bg-primary/20 blur-[120px]" />
                <div>
                  <Users2 className="h-12 w-12 text-primary mb-6" />
                  <h2 className="text-4xl font-black mb-4">بوابة الموظفين</h2>
                  <p className="text-slate-400 leading-relaxed max-w-sm">
                    إدارة شاملة للمنشآت، لوحات تحكم للمدراء، جدولة الصيانة الوقائية وإصدار تقارير الأداء التفصيلية.
                  </p>
                </div>
                <Link to="/auth" className="btn-shq-primary w-fit h-14 px-10 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 shadow-none">
                  دخول الموظفين
                </Link>
              </div>

              {/* Contractor Portal Card */}
              <div className="group rounded-[3rem] border-2 border-slate-100 p-12 text-slate-900 hover:border-primary/20 transition-all relative overflow-hidden flex flex-col justify-between h-[450px]">
                <div className="absolute bottom-0 left-0 h-48 w-48 bg-primary/5 blur-[80px]" />
                <div>
                  <HardHat className="h-12 w-12 text-primary mb-6" />
                  <h2 className="text-4xl font-black mb-4">بوابة المقاولين</h2>
                  <p className="text-slate-500 leading-relaxed max-w-sm">
                    استلام أوامر العمل، توثيق التنفيذ بالصور، رفع الفواتير، ومتابعة التقييمات السنوية.
                  </p>
                </div>
                <Link to="/auth" className="btn-shq-outline w-fit h-14 px-10 rounded-2xl">
                  بوابة الشركاء
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-50 py-20 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-400">
              © {new Date().getFullYear()} جميع الحقوق محفوظة — الجمعية الخيرية لتحفيظ القرآن الكريم بمحافظة الجبيل
            </p>
            <div className="flex gap-8 text-xs font-black text-slate-400 uppercase tracking-widest">
              <a href="#" className="hover:text-primary transition-colors">عن المنصة</a>
              <a href="#" className="hover:text-primary transition-colors">سياسة الخصوصية</a>
              <a href="#" className="hover:text-primary transition-colors">الدعم الفني</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

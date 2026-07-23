import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { AdminView } from "@/features/dashboards/AdminView";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — بوابة جمعية الجبيل" },
      { name: "description", content: "لوحة تحكم صيانة أصول جمعية الجبيل." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <AdminView />
      </main>
    </div>
  );
}

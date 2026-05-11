import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useApp } from "@/lib/app-store";
import { useI18n } from "@/lib/i18n";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { TaskCard } from "@/components/TaskCard";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { role, user, tasks } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (!role) navigate({ to: "/" });
  }, [role, navigate]);

  const active = tasks.filter((x) => ["new", "accepted", "in_progress"].includes(x.status));
  const completed = tasks.filter((x) => ["submitted", "paid"].includes(x.status));
  const earnings = tasks.filter((x) => x.status === "paid").reduce((s, x) => s + x.payout, 0);
  const pending = tasks.filter((x) => x.status === "submitted").reduce((s, x) => s + x.payout, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 px-4 pt-4 pb-6">
        <div className="px-1 mb-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{role === "agency" ? t("agency") : t("vendor")}</div>
          <h1 className="text-2xl font-bold leading-tight">{user?.name ?? t("welcome")}</h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label={t("activeTasks")} value={active.length} accent />
          <Stat label={t("completed")} value={completed.length} />
          <Stat label={role === "agency" ? t("spent") : t("earnings")} value={`₹${earnings.toLocaleString("en-IN")}`} success />
          <Stat label={t("pending")} value={`₹${pending.toLocaleString("en-IN")}`} warn />
        </div>

        {role === "agency" && (
          <Link to="/assign" className="mt-4 block rounded-2xl border border-primary/40 bg-primary/10 p-4 text-center font-medium text-primary hover:bg-primary/15 transition-colors">
            + {t("assignNew")}
          </Link>
        )}

        <section className="mt-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{role === "agency" ? t("inProgress") : t("newTasks")}</h2>
            <Link to="/tasks" className="text-xs text-primary">View all</Link>
          </div>
          <div className="space-y-3">
            {active.slice(0, 3).map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

function Stat({ label, value, accent, success, warn }: { label: string; value: string | number; accent?: boolean; success?: boolean; warn?: boolean }) {
  const tone = accent ? "text-primary" : success ? "text-success" : warn ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-[image:var(--gradient-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useApp } from "@/lib/app-store";
import { useI18n } from "@/lib/i18n";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { StatusBadge } from "@/components/TaskCard";

export const Route = createFileRoute("/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const { tasks, role } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  useEffect(() => { if (!role) navigate({ to: "/" }); }, [role, navigate]);

  const items = tasks.filter((x) => x.status === "submitted" || x.status === "paid");
  const paid = items.filter((x) => x.status === "paid").reduce((s, x) => s + x.payout, 0);
  const due = items.filter((x) => x.status === "submitted").reduce((s, x) => s + x.payout, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar title={t("payments")} />
      <main className="flex-1 px-4 pt-4 pb-6">
        <div className="rounded-2xl border border-border bg-[image:var(--gradient-surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{role === "agency" ? t("spent") : t("earnings")}</div>
          <div className="mt-1 text-3xl font-bold text-success">₹{paid.toLocaleString("en-IN")}</div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t("due")}</span>
            <span className="text-warning font-semibold">₹{due.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <h2 className="mt-6 mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("paymentHistory")}</h2>

        <div className="space-y-2">
          {items.map((task) => (
            <div key={task.id} className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{task.brand}</div>
                <div className="text-xs text-muted-foreground">{task.id} · {task.city}</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${task.status === "paid" ? "text-success" : "text-warning"}`}>₹{task.payout.toLocaleString("en-IN")}</div>
                <div className="mt-0.5"><StatusBadge status={task.status} /></div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">No payments yet.</div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

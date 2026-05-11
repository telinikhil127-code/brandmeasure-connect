import { Link } from "@tanstack/react-router";
import { Task, TaskStatus } from "@/lib/app-store";
import { useI18n } from "@/lib/i18n";

const statusStyle: Record<TaskStatus, string> = {
  new: "bg-primary/15 text-primary border-primary/30",
  accepted: "bg-accent/15 text-accent border-accent/30",
  in_progress: "bg-warning/15 text-warning border-warning/30",
  submitted: "bg-primary/15 text-primary-glow border-primary-glow/30",
  paid: "bg-success/15 text-success border-success/30",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useI18n();
  const label =
    status === "new" ? t("statusNew")
    : status === "accepted" ? t("statusAccepted")
    : status === "in_progress" ? t("statusInProgress")
    : status === "submitted" ? t("statusSubmitted")
    : t("statusPaid");

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${statusStyle[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function TaskCard({ task }: { task: Task }) {
  const { t } = useI18n();
  return (
    <Link
      to="/tasks/$taskId"
      params={{ taskId: task.id }}
      className="block rounded-2xl border border-border bg-[image:var(--gradient-surface)] p-4 shadow-[var(--shadow-card)] hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("brand")}</div>
          <div className="font-semibold leading-tight">{task.brand}</div>
        </div>
        <StatusBadge status={task.status} />
      </div>
      <div className="mt-3 text-sm text-foreground/90">{task.site}</div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {task.city}
        </span>
        <span>{t("deadline")}: {task.deadline}</span>
        <span className="text-success font-semibold">₹{task.payout.toLocaleString("en-IN")}</span>
      </div>
    </Link>
  );
}

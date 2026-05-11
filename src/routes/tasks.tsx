import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useApp, TaskStatus } from "@/lib/app-store";
import { useI18n } from "@/lib/i18n";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { TaskCard } from "@/components/TaskCard";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
});

const tabs: { key: "all" | TaskStatus; labelKey: "newTasks" | "inProgress" | "completed" | "statusNew" | "statusInProgress" }[] = [];

function TasksPage() {
  const { tasks, role } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");

  useEffect(() => { if (!role) navigate({ to: "/" }); }, [role, navigate]);

  const filtered = tasks.filter((task) =>
    filter === "all" ? true
    : filter === "active" ? ["new", "accepted", "in_progress"].includes(task.status)
    : ["submitted", "paid"].includes(task.status)
  );

  const Tab = ({ k, label }: { k: typeof filter; label: string }) => (
    <button
      onClick={() => setFilter(k)}
      className={`flex-1 py-2 text-xs font-medium rounded-xl transition-colors ${filter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
    >{label}</button>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar title={t("tasks")} />
      <main className="flex-1 px-4 pt-4 pb-6">
        <div className="flex gap-1 p-1 rounded-2xl bg-surface border border-border mb-4">
          <Tab k="active" label={t("inProgress")} />
          <Tab k="completed" label={t("completed")} />
          <Tab k="all" label="All" />
        </div>
        <div className="space-y-3">
          {filtered.map((task) => <TaskCard key={task.id} task={task} />)}
          {filtered.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">No tasks here yet.</div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

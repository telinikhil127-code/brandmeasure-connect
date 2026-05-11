import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-store";
import { useI18n } from "@/lib/i18n";
import { TopBar } from "@/components/TopBar";
import { StatusBadge } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/tasks/$taskId")({
  component: TaskDetail,
});

function TaskDetail() {
  const { taskId } = Route.useParams();
  const { tasks, updateTask, role } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const task = tasks.find((x) => x.id === taskId);

  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState(false);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar back={() => navigate({ to: "/tasks" })} title={t("taskDetail")} />
        <div className="p-6 text-center text-sm text-muted-foreground">Task not found</div>
      </div>
    );
  }

  const isVendor = role === "vendor";
  const canSubmit = task.status === "in_progress" && width && height && photo && gps;

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar back={() => navigate({ to: "/tasks" })} title={task.id} />
      <main className="flex-1 px-4 pt-4 pb-10 space-y-4">
        <div className="rounded-2xl border border-border bg-[image:var(--gradient-surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("brand")}</div>
              <div className="text-xl font-bold">{task.brand}</div>
            </div>
            <StatusBadge status={task.status} />
          </div>
          <div className="mt-3 text-sm">{task.site}</div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <Meta label={t("location")} value={task.city} />
            <Meta label={t("deadline")} value={task.deadline} />
            <Meta label={t("payout")} value={`₹${task.payout.toLocaleString("en-IN")}`} success />
          </div>
        </div>

        {isVendor && task.status === "new" && (
          <Button variant="hero" size="xl" className="w-full" onClick={() => { updateTask(task.id, { status: "accepted" }); toast.success(t("statusAccepted")); }}>
            {t("accept")}
          </Button>
        )}

        {isVendor && task.status === "accepted" && (
          <Button variant="surface" size="xl" className="w-full" onClick={() => updateTask(task.id, { status: "in_progress" })}>
            Start measurement
          </Button>
        )}

        {isVendor && task.status === "in_progress" && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold">{t("uploadMeasurements")}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="w">{t("width")}</Label>
                <Input id="w" inputMode="decimal" value={width} onChange={(e) => setWidth(e.target.value)} className="h-11 rounded-xl bg-surface" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="h">{t("height")}</Label>
                <Input id="h" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} className="h-11 rounded-xl bg-surface" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="n">{t("notes")}</Label>
              <Textarea id="n" value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl bg-surface min-h-20" />
            </div>

            <CaptureRow
              done={photo}
              label={t("capturePhoto")}
              onClick={() => { setPhoto(true); toast.success(t("photoCaptured")); }}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/></svg>
              }
            />
            <CaptureRow
              done={!!gps}
              label={gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : t("captureGPS")}
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (p) => { setGps({ lat: p.coords.latitude, lng: p.coords.longitude }); toast.success(t("gpsCaptured")); },
                    () => { setGps({ lat: 19.076, lng: 72.8777 }); toast.success(t("gpsCaptured")); }
                  );
                } else {
                  setGps({ lat: 19.076, lng: 72.8777 });
                  toast.success(t("gpsCaptured"));
                }
              }}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              }
            />

            <Button
              variant="hero"
              size="xl"
              className="w-full"
              disabled={!canSubmit}
              onClick={() => {
                updateTask(task.id, {
                  status: "submitted",
                  measurements: { width: Number(width), height: Number(height), notes },
                  photo: true,
                  gps: gps ?? undefined,
                });
                toast.success(t("submittedMsg"));
                navigate({ to: "/tasks" });
              }}
            >
              {t("submit")}
            </Button>
          </div>
        )}

        {task.status === "submitted" && task.measurements && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2 text-sm">
            <div className="font-semibold mb-2">Submitted Report</div>
            <KV k={t("width")} v={`${task.measurements.width} ft`} />
            <KV k={t("height")} v={`${task.measurements.height} ft`} />
            {task.gps && <KV k="GPS" v={`${task.gps.lat.toFixed(4)}, ${task.gps.lng.toFixed(4)}`} />}
            {task.measurements.notes && <KV k={t("notes")} v={task.measurements.notes} />}
          </div>
        )}

        {role === "agency" && task.status === "submitted" && (
          <Button
            variant="hero"
            size="xl"
            className="w-full"
            onClick={() => { updateTask(task.id, { status: "paid" }); toast.success(t("statusPaid")); }}
          >
            Mark as {t("paid")}
          </Button>
        )}
      </main>
    </div>
  );
}

function Meta({ label, value, success }: { label: string; value: string; success?: boolean }) {
  return (
    <div className="rounded-xl bg-background/50 border border-border p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold ${success ? "text-success" : ""}`}>{value}</div>
    </div>
  );
}

function CaptureRow({ done, label, onClick, icon }: { done: boolean; label: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between rounded-xl border p-3 text-sm transition-colors ${done ? "border-success/40 bg-success/10 text-success" : "border-border bg-surface hover:border-primary/40"}`}
    >
      <span className="flex items-center gap-3">
        <span className={`grid place-items-center h-9 w-9 rounded-lg ${done ? "bg-success/20" : "bg-primary/15 text-primary"}`}>
          {done ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5 9-11"/></svg>
          ) : icon}
        </span>
        {label}
      </span>
    </button>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-border/50 last:border-0 py-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

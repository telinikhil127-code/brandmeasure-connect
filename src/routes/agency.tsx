import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Activity,
  ArrowRightLeft,
  ClipboardList,
  CreditCard,
  IndianRupee,
  LayoutDashboard,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";

import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/app-store";
import {
  fetchActivity,
  fetchMeasurementTasks,
  fetchVendors,
  insertActivity,
  insertTask,
  updatePaymentStatus,
  updateTaskVendor,
  type MeasurementTaskRow,
  type VendorRow,
} from "@/lib/agency-supabase";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agency")({
  component: AgencyDashboardPage,
});

const ACTIVE_STATUSES = ["new", "accepted", "in_progress"];

function AgencyDashboardPage() {
  const { role, user } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!role) navigate({ to: "/" });
    else if (role !== "agency") navigate({ to: "/dashboard" });
  }, [role, navigate]);

  const client = mounted ? getSupabaseBrowserClient() : null;
  const configured = isSupabaseConfigured();

  const tasksQuery = useQuery({
    queryKey: ["agency", "measurement_tasks"],
    queryFn: () => fetchMeasurementTasks(client!),
    enabled: Boolean(client),
  });

  const vendorsQuery = useQuery({
    queryKey: ["agency", "vendors"],
    queryFn: () => fetchVendors(client!),
    enabled: Boolean(client),
  });

  const activityQuery = useQuery({
    queryKey: ["agency", "activity"],
    queryFn: () => fetchActivity(client!),
    enabled: Boolean(client),
  });

  const createTask = useMutation({
    mutationFn: async (form: {
      brand: string;
      site: string;
      city: string;
      deadline: string;
      payout_inr: number;
    }) => {
      if (!client) throw new Error("Supabase client unavailable");
      const task_code = `T-${Math.floor(1000 + Math.random() * 9000)}`;
      const inserted = await insertTask(client, {
        task_code,
        brand: form.brand.trim(),
        site: form.site.trim(),
        city: form.city.trim(),
        deadline: form.deadline.trim(),
        payout_inr: form.payout_inr,
        status: "new",
        payment_status: "unpaid",
      });
      await insertActivity(client, {
        task_id: inserted.id,
        message: `Measurement task ${inserted.task_code} created for ${form.brand.trim()}`,
        meta: { brand: form.brand },
      });
      return inserted;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["agency"] });
      toast.success("Measurement task created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignVendor = useMutation({
    mutationFn: async ({ taskId, vendorId }: { taskId: string; vendorId: string | null }) => {
      if (!client) throw new Error("Supabase client unavailable");
      await updateTaskVendor(client, taskId, vendorId);
      const v = vendorsQuery.data?.find((x) => x.id === vendorId);
      await insertActivity(client, {
        task_id: taskId,
        message: vendorId
          ? `Vendor assigned${v ? `: ${v.name}` : ""}`
          : "Vendor unassigned",
        meta: { vendor_id: vendorId },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["agency"] });
      toast.success("Assignment updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setPayment = useMutation({
    mutationFn: async ({ taskId, payment_status }: { taskId: string; payment_status: string }) => {
      if (!client) throw new Error("Supabase client unavailable");
      await updatePaymentStatus(client, taskId, payment_status);
      await insertActivity(client, {
        task_id: taskId,
        message: `Payment marked as ${payment_status}`,
        meta: { payment_status },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["agency"] });
      toast.success("Payment status saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tasks = tasksQuery.data ?? [];
  const activeTasks = useMemo(
    () => tasks.filter((t) => ACTIVE_STATUSES.includes(t.status)),
    [tasks],
  );

  const paymentTotals = useMemo(() => {
    const pending = tasks.filter((t) => t.payment_status === "pending").reduce((s, t) => s + Number(t.payout_inr), 0);
    const paid = tasks.filter((t) => t.payment_status === "paid").reduce((s, t) => s + Number(t.payout_inr), 0);
    const unpaid = tasks.filter((t) => t.payment_status === "unpaid").reduce((s, t) => s + Number(t.payout_inr), 0);
    return { pending, paid, unpaid };
  }, [tasks]);

  if (!role || role !== "agency") return null;

  return (
    <div className="min-h-screen flex flex-col pb-2">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,oklch(0.68_0.18_252/0.35),transparent)]" />

      <TopBar
        title="Agency"
        back={() => navigate({ to: "/dashboard" })}
        right={
          <span className="max-w-[140px] truncate text-xs text-muted-foreground hidden sm:inline">
            {user?.name ?? "Agency"}
          </span>
        }
      />

      <main className="relative flex-1 px-3 sm:px-4 pt-4 pb-6 space-y-6 max-w-lg mx-auto w-full">
        <header className="space-y-1 px-0.5">
          <div className="flex items-center gap-2 text-primary">
            <LayoutDashboard className="size-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">BrandMeasure Connect</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Agency dashboard
          </h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Create measurement jobs, assign vendors, track field status, and reconcile payouts in one place.
          </p>
        </header>

        {!configured && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="size-4 text-amber-400" />
                Supabase env vars missing
              </CardTitle>
              <CardDescription>
                Add <code className="text-xs bg-surface px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and{" "}
                <code className="text-xs bg-surface px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> to your{" "}
                <code className="text-xs">.env</code> file.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {configured && !client && (
          <Card className="border-border">
            <CardContent className="pt-6 text-sm text-muted-foreground">Loading workspace…</CardContent>
          </Card>
        )}

        {configured && client && tasksQuery.isError && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Could not load Supabase data</CardTitle>
              <CardDescription className="space-y-2">
                <p>{(tasksQuery.error as Error)?.message ?? "Unknown error"}</p>
                <p className="text-xs">
                  Run the SQL in{" "}
                  <code className="bg-surface px-1 rounded">supabase/migrations/20250512120000_agency_dashboard.sql</code>{" "}
                  in the Supabase SQL editor, then refresh.
                </p>
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {configured && client && !tasksQuery.isError && (
          <>
            <section className="grid grid-cols-2 gap-3">
              <StatTile
                icon={ClipboardList}
                label="Active tasks"
                value={String(activeTasks.length)}
                hint="New · Accepted · In progress"
                accent
              />
              <StatTile
                icon={Users}
                label="Vendors"
                value={String(vendorsQuery.data?.length ?? 0)}
                hint="Available to assign"
              />
              <StatTile
                icon={IndianRupee}
                label="Paid out"
                value={`₹${paymentTotals.paid.toLocaleString("en-IN")}`}
                hint="Marked paid"
                success
              />
              <StatTile
                icon={CreditCard}
                label="Awaiting pay"
                value={`₹${(paymentTotals.unpaid + paymentTotals.pending).toLocaleString("en-IN")}`}
                hint="Unpaid + pending"
                warn
              />
            </section>

            <div className="flex flex-col sm:flex-row gap-3">
              <CreateTaskDialog
                disabled={createTask.isPending}
                onSubmit={(form) => createTask.mutate(form)}
              />
              <Button
                variant="surface"
                className="h-12 rounded-2xl flex-1 justify-center gap-2 border-primary/20"
                onClick={() => navigate({ to: "/tasks" })}
              >
                <ClipboardList className="size-4 opacity-80" />
                All tasks (app)
              </Button>
            </div>

            <section>
              <div className="flex items-center justify-between mb-3 px-0.5">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Activity className="size-4" />
                  Active tasks
                </h2>
                {tasksQuery.isFetching && (
                  <span className="text-[11px] text-muted-foreground animate-pulse">Syncing…</span>
                )}
              </div>

              <div className="space-y-3">
                {activeTasks.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                      No active measurement tasks. Create one to get started.
                    </CardContent>
                  </Card>
                )}
                {activeTasks.map((task) => (
                  <TaskPanel
                    key={task.id}
                    task={task}
                    vendors={vendorsQuery.data ?? []}
                    disabledAssign={assignVendor.isPending}
                    onAssign={(vendorId) => assignVendor.mutate({ taskId: task.id, vendorId })}
                    onPayment={(payment_status) => setPayment.mutate({ taskId: task.id, payment_status })}
                    paymentBusy={setPayment.isPending}
                  />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-0.5 flex items-center gap-2">
                <CreditCard className="size-4" />
                Payment tracking
              </h2>
              <Card className="overflow-hidden border-border/80 shadow-[var(--shadow-card)]">
                <CardContent className="p-0">
                  <div className="grid grid-cols-3 divide-x divide-border text-center">
                    <div className="py-4 px-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Unpaid</div>
                      <div className="text-lg font-bold mt-1">₹{paymentTotals.unpaid.toLocaleString("en-IN")}</div>
                    </div>
                    <div className="py-4 px-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending</div>
                      <div className="text-lg font-bold mt-1 text-warning">₹{paymentTotals.pending.toLocaleString("en-IN")}</div>
                    </div>
                    <div className="py-4 px-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Paid</div>
                      <div className="text-lg font-bold mt-1 text-success">₹{paymentTotals.paid.toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                  <Separator />
                  <ScrollArea className="max-h-[220px]">
                    <ul className="divide-y divide-border">
                      {tasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{task.task_code}</div>
                            <div className="text-xs text-muted-foreground truncate">{task.brand} · {task.city}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground w-16">₹{Number(task.payout_inr).toLocaleString("en-IN")}</span>
                            <Select
                              value={task.payment_status}
                              onValueChange={(v) => setPayment.mutate({ taskId: task.id, payment_status: v })}
                              disabled={setPayment.isPending}
                            >
                              <SelectTrigger className="h-9 w-[130px] rounded-xl bg-surface border-border text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-0.5 flex items-center gap-2">
                <ArrowRightLeft className="size-4" />
                Recent activity
              </h2>
              <Card className="border-border/80 shadow-[var(--shadow-card)]">
                <CardContent className="p-0">
                  <ScrollArea className="h-[min(320px,50vh)]">
                    <ul className="divide-y divide-border">
                      {(activityQuery.data ?? []).length === 0 && (
                        <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                          Activity will appear when you create tasks or update assignments.
                        </li>
                      )}
                      {(activityQuery.data ?? []).map((row) => (
                        <li key={row.id} className="px-4 py-3 flex gap-3">
                          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/80 shadow-[0_0_12px_oklch(0.68_0.18_252/0.6)]" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug">{row.message}</p>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
                              <span>
                                {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                              </span>
                              {row.measurement_tasks && (
                                <span className="truncate">
                                  · {row.measurement_tasks.task_code} ({row.measurement_tasks.brand})
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  success,
  warn,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
  success?: boolean;
  warn?: boolean;
}) {
  const tone = accent ? "text-primary" : success ? "text-success" : warn ? "text-warning" : "text-foreground";
  return (
    <Card className="relative overflow-hidden border-border/80 bg-[image:var(--gradient-surface)] shadow-[var(--shadow-card)]">
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary/10 blur-2xl" />
      <CardHeader className="p-4 pb-2 space-y-0">
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="text-[10px] uppercase tracking-wider font-medium">{label}</CardDescription>
          <Icon className={cn("size-4 opacity-70", tone)} />
        </div>
        <CardTitle className={cn("text-xl font-bold tracking-tight", tone)}>{value}</CardTitle>
        <p className="text-[11px] text-muted-foreground pt-1 leading-snug">{hint}</p>
      </CardHeader>
    </Card>
  );
}

function TaskPanel({
  task,
  vendors,
  onAssign,
  onPayment,
  disabledAssign,
  paymentBusy,
}: {
  task: MeasurementTaskRow;
  vendors: VendorRow[];
  onAssign: (vendorId: string | null) => void;
  onPayment: (payment_status: string) => void;
  disabledAssign: boolean;
  paymentBusy: boolean;
}) {
  const vendorName = task.vendors?.name ?? null;

  return (
    <Card className="border-border/80 shadow-[var(--shadow-card)] overflow-hidden">
      <CardHeader className="p-4 pb-2 space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{task.task_code}</span>
              <StatusBadge status={task.status} />
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide border-border">
                Pay: {task.payment_status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{task.brand}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{task.site}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground">Payout</div>
            <div className="text-lg font-bold text-primary">₹{Number(task.payout_inr).toLocaleString("en-IN")}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="size-3.5" />
              Assign vendor
            </Label>
            <Select
              value={task.vendor_id ?? "none"}
              onValueChange={(v) => onAssign(v === "none" ? null : v)}
              disabled={disabledAssign}
            >
              <SelectTrigger className="h-11 rounded-xl bg-surface border-border">
                <SelectValue placeholder="Choose vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                    {v.city ? ` · ${v.city}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {vendorName && <p className="text-[11px] text-muted-foreground">Currently: {vendorName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <CreditCard className="size-3.5" />
              Payment
            </Label>
            <Select
              value={task.payment_status}
              onValueChange={onPayment}
              disabled={paymentBusy}
            >
              <SelectTrigger className="h-11 rounded-xl bg-surface border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1 border-t border-border/60">
          <span>Deadline: <span className="text-foreground">{task.deadline}</span></span>
          <span>City: <span className="text-foreground">{task.city}</span></span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  const variant = status === "submitted" ? "secondary" : "outline";
  const tone =
    status === "new"
      ? "border-primary/40 bg-primary/10 text-primary"
      : status === "paid"
        ? "border-success/50 bg-success/15 text-success"
        : status === "submitted"
          ? "border-warning/40 bg-warning/10 text-warning"
          : "border-border bg-muted/30 text-muted-foreground";

  return (
    <Badge variant={variant} className={cn("capitalize text-[10px]", tone)}>
      {label}
    </Badge>
  );
}

function CreateTaskDialog({
  onSubmit,
  disabled,
}: {
  onSubmit: (form: { brand: string; site: string; city: string; deadline: string; payout_inr: number }) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [site, setSite] = useState("");
  const [city, setCity] = useState("");
  const [deadline, setDeadline] = useState("");
  const [payout, setPayout] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payout_inr = Number(payout);
    if (!brand.trim() || !site.trim() || !city.trim() || !deadline.trim() || !Number.isFinite(payout_inr) || payout_inr <= 0) {
      toast.error("Please fill all fields with a valid payout.");
      return;
    }
    onSubmit({ brand, site, city, deadline, payout_inr });
    setOpen(false);
    setBrand("");
    setSite("");
    setCity("");
    setDeadline("");
    setPayout("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" className="h-12 rounded-2xl flex-1 gap-2 shadow-[var(--shadow-glow)]" disabled={disabled}>
          <Plus className="size-4" />
          New measurement task
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-border bg-card max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create measurement task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="bm-brand">Brand</Label>
            <Input
              id="bm-brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="h-11 rounded-xl bg-surface border-border"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bm-site">Site / location</Label>
            <Input
              id="bm-site"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="h-11 rounded-xl bg-surface border-border"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bm-city">City</Label>
            <Input
              id="bm-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-11 rounded-xl bg-surface border-border"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bm-deadline">Deadline</Label>
            <Input
              id="bm-deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="e.g. 20 May"
              className="h-11 rounded-xl bg-surface border-border"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bm-payout">Payout (₹)</Label>
            <Input
              id="bm-payout"
              type="number"
              min={1}
              step={1}
              value={payout}
              onChange={(e) => setPayout(e.target.value)}
              className="h-11 rounded-xl bg-surface border-border"
              required
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" disabled={disabled}>
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

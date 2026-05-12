import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Activity,
  Bell,
  Building2,
  Check,
  CheckCheck,
  IndianRupee,
  LayoutGrid,
  LineChart,
  MonitorDot,
  Shield,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { TopBar } from "@/components/TopBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  approveVendorRegistration,
  computeTaskAnalytics,
  fetchAdminNotifications,
  fetchAdminTasks,
  fetchAgencies,
  fetchPlatformUsers,
  fetchVendorRegistrations,
  markAllNotificationsRead,
  markNotificationRead,
  rejectVendorRegistration,
  setAgencyStatus,
  setPlatformUserStatus,
  type AgencyRow,
  type AdminNotificationRow,
  type PlatformUserRow,
} from "@/lib/admin-supabase";
import { fetchVendors } from "@/lib/agency-supabase";
import type { MeasurementTaskRow } from "@/lib/agency-supabase";
import { useApp } from "@/lib/app-store";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminDashboardPage,
});

const CHART_COLORS = ["#7c9eff", "#5eead4", "#fbbf24", "#f472b6", "#a78bfa", "#94a3b8"];
const PIE_COLORS = ["#22c55e", "#f59e0b", "#64748b"];

function AdminDashboardPage() {
  const { role, user } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!role) navigate({ to: "/" });
    else if (role !== "admin") navigate({ to: "/dashboard" });
  }, [role, navigate]);

  const client = mounted ? getSupabaseBrowserClient() : null;
  const configured = isSupabaseConfigured();

  const tasksQuery = useQuery({
    queryKey: ["admin", "tasks"],
    queryFn: () => fetchAdminTasks(client!),
    enabled: Boolean(client),
  });

  const agenciesQuery = useQuery({
    queryKey: ["admin", "agencies"],
    queryFn: () => fetchAgencies(client!),
    enabled: Boolean(client),
  });

  const vendorsQuery = useQuery({
    queryKey: ["admin", "vendors"],
    queryFn: () => fetchVendors(client!),
    enabled: Boolean(client),
  });

  const registrationsQuery = useQuery({
    queryKey: ["admin", "vendor_registrations"],
    queryFn: () => fetchVendorRegistrations(client!),
    enabled: Boolean(client),
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "platform_users"],
    queryFn: () => fetchPlatformUsers(client!),
    enabled: Boolean(client),
  });

  const notificationsQuery = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: () => fetchAdminNotifications(client!),
    enabled: Boolean(client),
  });

  const invalidateAdmin = () => queryClient.invalidateQueries({ queryKey: ["admin"] });

  const approveMut = useMutation({
    mutationFn: (id: string) => approveVendorRegistration(client!, id),
    onSuccess: () => {
      void invalidateAdmin();
      toast.success("Vendor approved and added to directory");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      rejectVendorRegistration(client!, id, notes),
    onSuccess: () => {
      void invalidateAdmin();
      toast.success("Registration rejected");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const agencyStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => setAgencyStatus(client!, id, status),
    onSuccess: () => {
      void invalidateAdmin();
      toast.success("Agency updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const userStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      setPlatformUserStatus(client!, id, status),
    onSuccess: () => {
      void invalidateAdmin();
      toast.success("User updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const readNotifMut = useMutation({
    mutationFn: (id: string) => markNotificationRead(client!, id),
    onSuccess: () => void invalidateAdmin(),
  });

  const readAllMut = useMutation({
    mutationFn: () => markAllNotificationsRead(client!),
    onSuccess: () => {
      void invalidateAdmin();
      toast.success("Notifications cleared");
    },
  });

  const tasks = tasksQuery.data ?? [];
  const analytics = useMemo(() => computeTaskAnalytics(tasks), [tasks]);

  const pendingRegs = useMemo(
    () => (registrationsQuery.data ?? []).filter((r) => r.status === "pending"),
    [registrationsQuery.data],
  );

  const unreadCount = useMemo(
    () => (notificationsQuery.data ?? []).filter((n) => !n.read_at).length,
    [notificationsQuery.data],
  );

  if (!role || role !== "admin") return null;

  return (
    <div className="min-h-screen flex flex-col pb-4">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-52 bg-[radial-gradient(ellipse_70%_50%_at_50%_-30%,oklch(0.55_0.2_280/0.35),transparent)]" />

      <TopBar
        title="Admin"
        back={() => navigate({ to: "/" })}
        right={
          <span className="max-w-[120px] truncate text-xs text-muted-foreground">{user?.name ?? "Admin"}</span>
        }
      />

      <main className="relative flex-1 px-3 sm:px-4 pt-4 pb-8 max-w-lg mx-auto w-full space-y-5">
        <header className="space-y-1 px-0.5">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="size-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor agencies, vendors, tasks, revenue, and approvals across BrandMeasure Connect.
          </p>
        </header>

        {!configured && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-base">Supabase not configured</CardTitle>
              <CardDescription>
                Set <code className="text-xs bg-surface px-1 rounded">VITE_SUPABASE_URL</code> and{" "}
                <code className="text-xs bg-surface px-1 rounded">VITE_SUPABASE_ANON_KEY</code>.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {configured && !client && (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground text-center">Loading…</CardContent>
          </Card>
        )}

        {configured && client && tasksQuery.isError && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive text-base">Database error</CardTitle>
              <CardDescription className="text-xs space-y-2">
                {(tasksQuery.error as Error).message}
                <span className="block">
                  Apply migrations:{" "}
                  <code className="bg-surface px-1 rounded">supabase/migrations/*.sql</code>
                </span>
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {configured && client && !tasksQuery.isError && (
          <Tabs defaultValue="overview" className="w-full space-y-5">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-surface/80 p-1 border border-border">
              <TabsTrigger value="overview" className="rounded-xl gap-1.5 text-xs sm:text-sm px-2.5 py-2">
                <LayoutGrid className="size-3.5 shrink-0" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="directory" className="rounded-xl gap-1.5 text-xs sm:text-sm px-2.5 py-2">
                <Building2 className="size-3.5 shrink-0" />
                Directory
              </TabsTrigger>
              <TabsTrigger value="approvals" className="rounded-xl gap-1.5 text-xs sm:text-sm px-2.5 py-2">
                <UserCheck className="size-3.5 shrink-0" />
                Approvals
                {pendingRegs.length > 0 && (
                  <Badge variant="destructive" className="ml-0.5 h-5 min-w-5 px-1 text-[10px]">
                    {pendingRegs.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="rounded-xl gap-1.5 text-xs sm:text-sm px-2.5 py-2">
                <MonitorDot className="size-3.5 shrink-0" />
                Monitoring
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-xl gap-1.5 text-xs sm:text-sm px-2.5 py-2">
                <Users className="size-3.5 shrink-0" />
                Users
              </TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-xl gap-1.5 text-xs sm:text-sm px-2.5 py-2">
                <Bell className="size-3.5 shrink-0" />
                Alerts
                {unreadCount > 0 && (
                  <Badge className="ml-0.5 h-5 min-w-5 px-1 text-[10px] bg-primary">{unreadCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-5 mt-0 outline-none">
              <section className="grid grid-cols-2 gap-3">
                <StatCard label="Agencies" value={String((agenciesQuery.data ?? []).length)} icon={Building2} accent />
                <StatCard label="Vendors" value={String((vendorsQuery.data ?? []).length)} icon={Users} />
                <StatCard label="Tasks" value={String(analytics.totalTasks)} icon={Activity} />
                <StatCard
                  label="GMV (paid)"
                  value={`₹${analytics.revenuePaid.toLocaleString("en-IN")}`}
                  icon={IndianRupee}
                  success
                />
              </section>

              <div className="grid gap-4">
                <Card className="border-border/80 shadow-[var(--shadow-card)] overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <LineChart className="size-4" />
                      Task analytics
                    </CardTitle>
                    <CardDescription>Tasks by workflow status</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[220px]">
                    {analytics.chart.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-12">No task data yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.chart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="oklch(0.68 0.02 250)" />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="oklch(0.68 0.02 250)" />
                          <Tooltip
                            contentStyle={{
                              background: "oklch(0.22 0.025 252)",
                              border: "1px solid oklch(0.3 0.025 254 / 60%)",
                              borderRadius: "12px",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {analytics.chart.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/80 shadow-[var(--shadow-card)] overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <IndianRupee className="size-4" />
                      Revenue analytics
                    </CardTitle>
                    <CardDescription>
                      Paid ₹{analytics.revenuePaid.toLocaleString("en-IN")} · Outstanding ₹
                      {analytics.revenuePending.toLocaleString("en-IN")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row gap-6 items-center justify-between pb-6">
                    <div className="h-[180px] w-full max-w-[200px] grid place-items-center">
                      {analytics.paymentMix.some((x) => x.value > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.paymentMix.filter((x) => x.value > 0)}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={44}
                              outerRadius={72}
                              paddingAngle={3}
                            >
                              {analytics.paymentMix
                                .filter((x) => x.value > 0)
                                .map((_, i) => (
                                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: "oklch(0.22 0.025 252)",
                                border: "1px solid oklch(0.3 0.025 254 / 60%)",
                                borderRadius: "12px",
                                fontSize: "12px",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center px-2">No payment breakdown yet.</p>
                      )}
                    </div>
                    <ul className="flex-1 space-y-2 text-sm w-full">
                      <li className="flex justify-between border-b border-border/50 pb-2">
                        <span className="text-muted-foreground">Paid volume</span>
                        <span className="font-semibold text-success">₹{analytics.revenuePaid.toLocaleString("en-IN")}</span>
                      </li>
                      <li className="flex justify-between border-b border-border/50 pb-2">
                        <span className="text-muted-foreground">Outstanding</span>
                        <span className="font-semibold text-warning">₹{analytics.revenuePending.toLocaleString("en-IN")}</span>
                      </li>
                      <li className="flex justify-between pt-1">
                        <span className="text-muted-foreground">Total tasks</span>
                        <span className="font-semibold">{analytics.totalTasks}</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <NotificationsPanel
                items={notificationsQuery.data ?? []}
                onRead={(id) => readNotifMut.mutate(id)}
                onReadAll={() => readAllMut.mutate()}
                busyRead={readNotifMut.isPending}
                busyAll={readAllMut.isPending}
              />
            </TabsContent>

            <TabsContent value="directory" className="space-y-6 mt-0 outline-none">
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Agencies</h2>
                <div className="space-y-2">
                  {(agenciesQuery.data ?? []).map((a) => (
                    <AgencyCard key={a.id} agency={a} onSetStatus={(s) => agencyStatusMut.mutate({ id: a.id, status: s })} />
                  ))}
                  {(agenciesQuery.data ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground py-6 text-center">No agencies.</p>
                  )}
                </div>
              </section>
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Vendors</h2>
                <ScrollArea className="max-h-[320px] rounded-2xl border border-border">
                  <ul className="divide-y divide-border">
                    {(vendorsQuery.data ?? []).map((v) => (
                      <li key={v.id} className="px-4 py-3 flex flex-col gap-0.5">
                        <span className="font-medium">{v.name}</span>
                        <span className="text-xs text-muted-foreground">{v.email ?? "—"} · {v.city ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </section>
            </TabsContent>

            <TabsContent value="approvals" className="mt-0 outline-none space-y-3">
              <p className="text-sm text-muted-foreground px-0.5">
                Review vendor sign-ups before they join the measurement network.
              </p>
              {(registrationsQuery.data ?? []).filter((r) => r.status === "pending").length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    No pending registrations.
                  </CardContent>
                </Card>
              )}
              {(registrationsQuery.data ?? [])
                .filter((r) => r.status === "pending")
                .map((r) => (
                  <Card key={r.id} className="border-border/80 shadow-[var(--shadow-card)]">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between gap-2">
                        <CardTitle className="text-base">{r.full_name}</CardTitle>
                        <Badge variant="outline" className="shrink-0">
                          Pending
                        </Badge>
                      </div>
                      <CardDescription className="text-xs space-y-0.5">
                        <div>{r.email}</div>
                        <div>{r.company ?? "—"} · {r.city ?? "—"}</div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="rounded-xl gap-1"
                        onClick={() => approveMut.mutate(r.id)}
                        disabled={approveMut.isPending}
                      >
                        <Check className="size-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-xl gap-1"
                        onClick={() => rejectMut.mutate({ id: r.id })}
                        disabled={rejectMut.isPending}
                      >
                        <X className="size-4" />
                        Reject
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="monitoring" className="mt-0 outline-none space-y-6">
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <MonitorDot className="size-4" />
                  Task monitoring
                </h2>
                <ScrollArea className="max-h-[min(360px,55vh)] rounded-2xl border border-border">
                  <ul className="divide-y divide-border">
                    {tasks.map((t) => (
                      <TaskRow key={t.id} task={t} />
                    ))}
                  </ul>
                </ScrollArea>
              </section>
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <IndianRupee className="size-4" />
                  Payment monitoring
                </h2>
                <Card>
                  <CardContent className="p-0 divide-y divide-border">
                    {tasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{t.task_code}</div>
                          <div className="text-xs text-muted-foreground truncate">{t.brand}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-semibold">₹{Number(t.payout_inr).toLocaleString("en-IN")}</div>
                          <Badge variant="outline" className="mt-1 text-[10px] capitalize">
                            {t.payment_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground text-sm">No tasks.</div>
                    )}
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            <TabsContent value="users" className="mt-0 outline-none space-y-3">
              <p className="text-sm text-muted-foreground px-0.5">
                Directory accounts across agencies, vendors, and platform admins.
              </p>
              {(usersQuery.data ?? []).map((u) => (
                <PlatformUserCard
                  key={u.id}
                  account={u}
                  onSetStatus={(s) => userStatusMut.mutate({ id: u.id, status: s })}
                />
              ))}
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 outline-none">
              <NotificationsPanel
                items={notificationsQuery.data ?? []}
                onRead={(id) => readNotifMut.mutate(id)}
                onReadAll={() => readAllMut.mutate()}
                busyRead={readNotifMut.isPending}
                busyAll={readAllMut.isPending}
                fullHeight
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  success,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
  success?: boolean;
}) {
  const tone = accent ? "text-primary" : success ? "text-success" : "text-foreground";
  return (
    <Card className="relative overflow-hidden border-border/80 bg-[image:var(--gradient-surface)] shadow-[var(--shadow-card)]">
      <CardHeader className="p-4 space-y-1">
        <div className="flex items-center justify-between">
          <CardDescription className="text-[10px] uppercase tracking-wider font-medium">{label}</CardDescription>
          <Icon className={cn("size-4 opacity-70", tone)} />
        </div>
        <CardTitle className={cn("text-xl font-bold", tone)}>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function AgencyCard({
  agency,
  onSetStatus,
}: {
  agency: AgencyRow;
  onSetStatus: (status: string) => void;
}) {
  const active = agency.status === "active";
  return (
    <Card className="border-border/80">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <div className="font-semibold">{agency.name}</div>
          <div className="text-xs text-muted-foreground">{agency.contact_email ?? "—"} · {agency.city ?? "—"}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={active ? "default" : "destructive"} className="capitalize">
            {agency.status}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={() => onSetStatus(active ? "suspended" : "active")}
          >
            {active ? "Suspend" : "Activate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformUserCard({
  account,
  onSetStatus,
}: {
  account: PlatformUserRow;
  onSetStatus: (status: string) => void;
}) {
  const enabled = account.status === "active";
  return (
    <Card className="border-border/80">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <div className="font-semibold">{account.display_name}</div>
          <div className="text-xs text-muted-foreground">{account.email}</div>
          <Badge variant="outline" className="mt-2 text-[10px] capitalize">
            {account.user_role}
          </Badge>
        </div>
        <Button
          size="sm"
          variant={enabled ? "destructive" : "default"}
          className="rounded-xl shrink-0"
          onClick={() => onSetStatus(enabled ? "disabled" : "active")}
        >
          {enabled ? "Disable" : "Enable"}
        </Button>
      </CardContent>
    </Card>
  );
}

function TaskRow({ task }: { task: MeasurementTaskRow }) {
  return (
    <li className="px-4 py-3 flex flex-col gap-1">
      <div className="flex justify-between gap-2">
        <span className="font-medium">{task.task_code}</span>
        <Badge variant="outline" className="capitalize text-[10px] shrink-0">
          {task.status.replace(/_/g, " ")}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground line-clamp-2">{task.site}</div>
      <div className="text-[11px] text-muted-foreground">
        {task.city} · ₹{Number(task.payout_inr).toLocaleString("en-IN")}
      </div>
    </li>
  );
}

function NotificationsPanel({
  items,
  onRead,
  onReadAll,
  busyRead,
  busyAll,
  fullHeight,
}: {
  items: AdminNotificationRow[];
  onRead: (id: string) => void;
  onReadAll: () => void;
  busyRead?: boolean;
  busyAll?: boolean;
  fullHeight?: boolean;
}) {
  const unread = items.filter((n) => !n.read_at);

  return (
    <Card className={cn("border-border/80 shadow-[var(--shadow-card)]", fullHeight && "min-h-[320px]")}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="size-4" />
          Notifications
        </CardTitle>
        {unread.length > 0 && (
          <Button size="sm" variant="ghost" className="rounded-xl h-8 gap-1 text-xs" onClick={onReadAll} disabled={busyAll}>
            <CheckCheck className="size-3.5" />
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={cn(fullHeight ? "h-[min(420px,60vh)]" : "h-[min(240px,35vh)]")}>
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "px-4 py-3 flex gap-3",
                  !n.read_at && "bg-primary/5",
                )}
              >
                <SeverityDot severity={n.severity} />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-sm">{n.title}</span>
                    {!n.read_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px] shrink-0"
                        onClick={() => onRead(n.id)}
                        disabled={busyRead}
                      >
                        Read
                      </Button>
                    )}
                  </div>
                  {n.body && <p className="text-xs text-muted-foreground leading-relaxed">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
            {items.length === 0 && (
              <li className="px-4 py-12 text-center text-sm text-muted-foreground">No notifications.</li>
            )}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const cls =
    severity === "critical"
      ? "bg-destructive shadow-[0_0_12px_oklch(0.65_0.22_25/0.5)]"
      : severity === "warning"
        ? "bg-warning shadow-[0_0_12px_oklch(0.78_0.15_75/0.4)]"
        : "bg-primary/80 shadow-[0_0_12px_oklch(0.68_0.18_252/0.4)]";
  return <div className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", cls)} />;
}

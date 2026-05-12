import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgencyDatabase } from "@/lib/supabase";
import { fetchMeasurementTasks, type MeasurementTaskRow } from "@/lib/agency-supabase";

export type AgencyRow = AgencyDatabase["public"]["Tables"]["agencies"]["Row"];
export type VendorRegistrationRow = AgencyDatabase["public"]["Tables"]["vendor_registrations"]["Row"];
export type PlatformUserRow = AgencyDatabase["public"]["Tables"]["platform_users"]["Row"];
export type AdminNotificationRow = AgencyDatabase["public"]["Tables"]["admin_notifications"]["Row"];

export async function fetchAgencies(client: SupabaseClient<AgencyDatabase>): Promise<AgencyRow[]> {
  const { data, error } = await client.from("agencies").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchVendorRegistrations(
  client: SupabaseClient<AgencyDatabase>,
): Promise<VendorRegistrationRow[]> {
  const { data, error } = await client.from("vendor_registrations").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPlatformUsers(client: SupabaseClient<AgencyDatabase>): Promise<PlatformUserRow[]> {
  const { data, error } = await client.from("platform_users").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAdminNotifications(
  client: SupabaseClient<AgencyDatabase>,
): Promise<AdminNotificationRow[]> {
  const { data, error } = await client
    .from("admin_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function insertAdminNotification(
  client: SupabaseClient<AgencyDatabase>,
  row: AgencyDatabase["public"]["Tables"]["admin_notifications"]["Insert"],
): Promise<void> {
  const { error } = await client.from("admin_notifications").insert(row);
  if (error) throw error;
}

export async function approveVendorRegistration(
  client: SupabaseClient<AgencyDatabase>,
  registrationId: string,
): Promise<void> {
  const { data: reg, error: regErr } = await client
    .from("vendor_registrations")
    .select("*")
    .eq("id", registrationId)
    .single();
  if (regErr) throw regErr;
  if (!reg) throw new Error("Registration not found");
  if (reg.status !== "pending") throw new Error("Already reviewed");

  const { error: vErr } = await client.from("vendors").insert({
    name: reg.full_name,
    email: reg.email,
    city: reg.city,
    phone: reg.phone,
  });
  if (vErr) throw vErr;

  const { error: upErr } = await client
    .from("vendor_registrations")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", registrationId);
  if (upErr) throw upErr;

  await insertAdminNotification(client, {
    title: "Vendor approved",
    body: `${reg.full_name} (${reg.email}) was added to the vendor directory.`,
    severity: "info",
    meta: { registration_id: registrationId },
  });
}

export async function rejectVendorRegistration(
  client: SupabaseClient<AgencyDatabase>,
  registrationId: string,
  notes?: string,
): Promise<void> {
  const { error } = await client
    .from("vendor_registrations")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .eq("id", registrationId);
  if (error) throw error;

  await insertAdminNotification(client, {
    title: "Vendor registration rejected",
    body: notes ?? "Registration was rejected.",
    severity: "warning",
    meta: { registration_id: registrationId },
  });
}

export async function setAgencyStatus(
  client: SupabaseClient<AgencyDatabase>,
  agencyId: string,
  status: string,
): Promise<void> {
  const { error } = await client.from("agencies").update({ status }).eq("id", agencyId);
  if (error) throw error;
}

export async function setPlatformUserStatus(
  client: SupabaseClient<AgencyDatabase>,
  userId: string,
  status: string,
): Promise<void> {
  const { error } = await client.from("platform_users").update({ status }).eq("id", userId);
  if (error) throw error;
}

export async function markNotificationRead(
  client: SupabaseClient<AgencyDatabase>,
  notificationId: string,
): Promise<void> {
  const { error } = await client
    .from("admin_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
  if (error) throw error;
}

export async function markAllNotificationsRead(client: SupabaseClient<AgencyDatabase>): Promise<void> {
  const { error } = await client
    .from("admin_notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) throw error;
}

export function computeTaskAnalytics(tasks: MeasurementTaskRow[]) {
  const byStatus: Record<string, number> = {};
  for (const t of tasks) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
  }
  const chart = Object.entries(byStatus).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  const revenuePaid = tasks.filter((t) => t.payment_status === "paid").reduce((s, t) => s + Number(t.payout_inr), 0);
  const revenuePending = tasks
    .filter((t) => t.payment_status === "pending" || t.payment_status === "unpaid")
    .reduce((s, t) => s + Number(t.payout_inr), 0);

  return {
    totalTasks: tasks.length,
    byStatus,
    chart,
    revenuePaid,
    revenuePending,
    paymentMix: [
      { name: "Paid", value: tasks.filter((t) => t.payment_status === "paid").length },
      { name: "Pending", value: tasks.filter((t) => t.payment_status === "pending").length },
      { name: "Unpaid", value: tasks.filter((t) => t.payment_status === "unpaid").length },
    ],
  };
}

export async function fetchAdminTasks(client: SupabaseClient<AgencyDatabase>): Promise<MeasurementTaskRow[]> {
  return fetchMeasurementTasks(client);
}

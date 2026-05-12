import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgencyDatabase } from "@/lib/supabase";

export type MeasurementTaskRow = AgencyDatabase["public"]["Tables"]["measurement_tasks"]["Row"] & {
  vendors: { name: string; email: string | null; city: string | null } | null;
};

export type VendorRow = AgencyDatabase["public"]["Tables"]["vendors"]["Row"];

export type ActivityRow = AgencyDatabase["public"]["Tables"]["agency_activity_log"]["Row"] & {
  measurement_tasks: { task_code: string; brand: string } | null;
};

export async function fetchMeasurementTasks(
  client: SupabaseClient<AgencyDatabase>,
): Promise<MeasurementTaskRow[]> {
  const { data, error } = await client
    .from("measurement_tasks")
    .select("*, vendors(name, email, city)")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as MeasurementTaskRow[];
}

export async function fetchVendors(client: SupabaseClient<AgencyDatabase>): Promise<VendorRow[]> {
  const { data, error } = await client.from("vendors").select("*").order("name");

  if (error) throw error;
  return data ?? [];
}

export async function fetchActivity(client: SupabaseClient<AgencyDatabase>): Promise<ActivityRow[]> {
  const { data, error } = await client
    .from("agency_activity_log")
    .select("*, measurement_tasks(task_code, brand)")
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) throw error;
  return (data ?? []) as ActivityRow[];
}

export async function insertTask(
  client: SupabaseClient<AgencyDatabase>,
  row: AgencyDatabase["public"]["Tables"]["measurement_tasks"]["Insert"],
): Promise<{ id: string; task_code: string }> {
  const { data, error } = await client
    .from("measurement_tasks")
    .insert({
      ...row,
      updated_at: new Date().toISOString(),
    })
    .select("id, task_code")
    .single();

  if (error) throw error;
  if (!data) throw new Error("No row returned");
  return data;
}

export async function insertActivity(
  client: SupabaseClient<AgencyDatabase>,
  row: AgencyDatabase["public"]["Tables"]["agency_activity_log"]["Insert"],
): Promise<void> {
  const { error } = await client.from("agency_activity_log").insert(row);
  if (error) throw error;
}

export async function updateTaskVendor(
  client: SupabaseClient<AgencyDatabase>,
  taskId: string,
  vendorId: string | null,
): Promise<void> {
  const { error } = await client
    .from("measurement_tasks")
    .update({
      vendor_id: vendorId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) throw error;
}

export async function updatePaymentStatus(
  client: SupabaseClient<AgencyDatabase>,
  taskId: string,
  paymentStatus: string,
): Promise<void> {
  const patch: AgencyDatabase["public"]["Tables"]["measurement_tasks"]["Update"] = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
  };
  if (paymentStatus === "paid") {
    patch.status = "paid";
  }

  const { error } = await client.from("measurement_tasks").update(patch).eq("id", taskId);

  if (error) throw error;
}

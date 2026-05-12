import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string | undefined);

export type AgencyDatabase = {
  public: {
    Tables: {
      vendors: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          city: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          city?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: Partial<AgencyDatabase["public"]["Tables"]["vendors"]["Insert"]>;
      };
      measurement_tasks: {
        Row: {
          id: string;
          task_code: string;
          brand: string;
          site: string;
          city: string;
          deadline: string;
          payout_inr: number;
          status: string;
          vendor_id: string | null;
          payment_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_code: string;
          brand: string;
          site: string;
          city: string;
          deadline: string;
          payout_inr?: number;
          status?: string;
          vendor_id?: string | null;
          payment_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<AgencyDatabase["public"]["Tables"]["measurement_tasks"]["Insert"]>;
      };
      agency_activity_log: {
        Row: {
          id: string;
          task_id: string | null;
          message: string;
          meta: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id?: string | null;
          message: string;
          meta?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: Partial<AgencyDatabase["public"]["Tables"]["agency_activity_log"]["Insert"]>;
      };
      agencies: {
        Row: {
          id: string;
          name: string;
          contact_email: string | null;
          city: string | null;
          phone: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_email?: string | null;
          city?: string | null;
          phone?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<AgencyDatabase["public"]["Tables"]["agencies"]["Insert"]>;
      };
      vendor_registrations: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          company: string | null;
          city: string | null;
          status: string;
          notes: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          city?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: Partial<AgencyDatabase["public"]["Tables"]["vendor_registrations"]["Insert"]>;
      };
      platform_users: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          user_role: string;
          agency_id: string | null;
          vendor_id: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          display_name: string;
          user_role: string;
          agency_id?: string | null;
          vendor_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<AgencyDatabase["public"]["Tables"]["platform_users"]["Insert"]>;
      };
      admin_notifications: {
        Row: {
          id: string;
          title: string;
          body: string | null;
          severity: string;
          read_at: string | null;
          meta: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body?: string | null;
          severity?: string;
          read_at?: string | null;
          meta?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: Partial<AgencyDatabase["public"]["Tables"]["admin_notifications"]["Insert"]>;
      };
    };
  };
};

let browserClient: SupabaseClient<AgencyDatabase> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient<AgencyDatabase> | null {
  if (!url || !anon) return null;
  if (typeof window === "undefined") return null;
  if (!browserClient) {
    browserClient = createClient<AgencyDatabase>(url, anon);
  }
  return browserClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anon);
}

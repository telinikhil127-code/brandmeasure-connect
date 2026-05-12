import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Role = "agency" | "vendor" | "admin";

export type TaskStatus = "new" | "accepted" | "in_progress" | "submitted" | "paid";

export interface Task {
  id: string;
  brand: string;
  site: string;
  city: string;
  deadline: string;
  payout: number;
  status: TaskStatus;
  measurements?: { width: number; height: number; notes: string };
  photo?: boolean;
  gps?: { lat: number; lng: number };
}

const fallbackTasks: Task[] = [
  { id: "T-1042", brand: "Tata Tea", site: "Hoarding @ MG Road Crossing", city: "Bengaluru", deadline: "12 May", payout: 1500, status: "new" },
  { id: "T-1041", brand: "Amul", site: "Bus Shelter, Sector 18", city: "Noida", deadline: "11 May", payout: 1200, status: "accepted" },
  { id: "T-1040", brand: "Asian Paints", site: "Wall Branding, FC Road", city: "Pune", deadline: "10 May", payout: 2200, status: "in_progress" },
  { id: "T-1039", brand: "Parle-G", site: "Shop Front, Lajpat Nagar", city: "Delhi", deadline: "08 May", payout: 900, status: "submitted" },
  { id: "T-1038", brand: "Britannia", site: "Hoarding, Andheri West", city: "Mumbai", deadline: "05 May", payout: 1800, status: "paid" },
  { id: "T-1037", brand: "Dabur", site: "Auto Branding x12", city: "Jaipur", deadline: "03 May", payout: 2400, status: "paid" },
];

interface AppCtx {
  role: Role | null;
  setRole: (r: Role | null) => void;
  user: { name: string; email: string } | null;
  setUser: (u: { name: string; email: string } | null) => void;
  tasks: Task[];
  tasksLoading: boolean;
  firestoreConnected: boolean;
  firestoreEmpty: boolean;
  updateTask: (id: string, patch: Partial<Task>) => void;
  addTask: (t: Task) => void;
  logout: () => void;
}

const Ctx = createContext<AppCtx | null>(null);
const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || "brandmeasureconnect";
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const hasFirestoreConfig = Boolean(FIREBASE_API_KEY && FIREBASE_PROJECT_ID);

function toFirestoreValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") return { doubleValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((v) => toFirestoreValue(v)) } };
  }
  if (typeof value === "object") {
    const fields = Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (acc, [key, val]) => {
        if (val !== undefined) acc[key] = toFirestoreValue(val);
        return acc;
      },
      {},
    );
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function fromFirestoreValue(value: any): unknown {
  if (!value || typeof value !== "object") return undefined;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue?.values ?? []).map(fromFirestoreValue);
  if ("mapValue" in value) {
    const fields = value.mapValue?.fields ?? {};
    return Object.entries(fields).reduce<Record<string, unknown>>((acc, [k, v]) => {
      acc[k] = fromFirestoreValue(v);
      return acc;
    }, {});
  }
  return undefined;
}

function parseFirestoreDoc(doc: any): Task {
  const id = String(doc.name ?? "").split("/").pop() || "";
  const fields = doc.fields ?? {};
  const data = Object.entries(fields).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[key] = fromFirestoreValue(value);
    return acc;
  }, {});

  return {
    id: String(data.id ?? id),
    brand: String(data.brand ?? ""),
    site: String(data.site ?? ""),
    city: String(data.city ?? ""),
    deadline: String(data.deadline ?? ""),
    payout: Number(data.payout ?? 0),
    status: (data.status as TaskStatus) ?? "new",
    measurements: data.measurements as Task["measurements"],
    photo: Boolean(data.photo ?? false),
    gps: data.gps as Task["gps"],
  };
}

async function fetchTasksFromFirestore(): Promise<Task[]> {
  if (!hasFirestoreConfig) return [];
  const res = await fetch(`${FIRESTORE_BASE_URL}/tasks?key=${encodeURIComponent(FIREBASE_API_KEY)}`);
  if (!res.ok) throw new Error(`Firestore fetch failed: ${res.status}`);
  const payload = await res.json();
  const documents = payload.documents ?? [];
  return documents.map((d: any) => parseFirestoreDoc(d));
}

async function upsertTaskToFirestore(task: Task): Promise<void> {
  if (!hasFirestoreConfig) return;
  const fields = Object.entries(task).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value !== undefined) acc[key] = toFirestoreValue(value);
    return acc;
  }, {});

  await fetch(
    `${FIRESTORE_BASE_URL}/tasks/${encodeURIComponent(task.id)}?key=${encodeURIComponent(FIREBASE_API_KEY)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    },
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [tasks, setTasks] = useState<Task[]>(fallbackTasks);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [firestoreConnected, setFirestoreConnected] = useState(false);
  const [firestoreEmpty, setFirestoreEmpty] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      if (!hasFirestoreConfig) return;
      setTasksLoading(true);

      try {
        const firestoreTasks = await fetchTasksFromFirestore();
        setFirestoreConnected(true);
        setFirestoreEmpty(firestoreTasks.length === 0);
        setTasks(firestoreTasks.length > 0 ? firestoreTasks : []);
      } catch (error) {
        setFirestoreConnected(false);
        console.error("Failed to load Firestore tasks:", error);
      } finally {
        setTasksLoading(false);
      }
    };

    void loadTasks();
  }, []);

  const updateTask = (id: string, patch: Partial<Task>) => {
    let updatedTask: Task | null = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        updatedTask = { ...t, ...patch };
        return updatedTask;
      }),
    );

    if (!updatedTask) return;
    void upsertTaskToFirestore(updatedTask).catch((error) => {
      console.error(`Failed to update Firestore task ${id}:`, error);
    });
  };

  const addTask = (t: Task) => {
    setTasks((prev) => [t, ...prev]);
    setFirestoreEmpty(false);

    void upsertTaskToFirestore(t).catch((error) => {
      console.error(`Failed to create Firestore task ${t.id}:`, error);
    });
  };

  const logout = () => {
    setUser(null);
    setRole(null);
  };

  return (
    <Ctx.Provider
      value={{
        role,
        setRole,
        user,
        setUser,
        tasks,
        tasksLoading,
        firestoreConnected,
        firestoreEmpty,
        updateTask,
        addTask,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

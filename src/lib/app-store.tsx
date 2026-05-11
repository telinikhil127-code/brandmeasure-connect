import { createContext, useContext, useState, ReactNode } from "react";

export type Role = "agency" | "vendor";

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

const initial: Task[] = [
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
  updateTask: (id: string, patch: Partial<Task>) => void;
  addTask: (t: Task) => void;
  logout: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [tasks, setTasks] = useState<Task[]>(initial);

  const updateTask = (id: string, patch: Partial<Task>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const addTask = (t: Task) => setTasks((prev) => [t, ...prev]);

  const logout = () => {
    setUser(null);
    setRole(null);
  };

  return (
    <Ctx.Provider value={{ role, setRole, user, setUser, tasks, updateTask, addTask, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

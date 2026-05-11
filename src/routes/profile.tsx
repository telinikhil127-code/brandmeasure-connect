import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useApp } from "@/lib/app-store";
import { useI18n } from "@/lib/i18n";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, role, logout } = useApp();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  useEffect(() => { if (!role) navigate({ to: "/" }); }, [role, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar title={t("profile")} />
      <main className="flex-1 px-4 pt-4 pb-6">
        <div className="rounded-2xl border border-border bg-[image:var(--gradient-surface)] p-5 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center text-primary-foreground text-xl font-bold">
            {(user?.name ?? "U").charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-lg">{user?.name ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
            <div className="mt-1 inline-flex text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary/30 text-primary">
              {role === "agency" ? t("agency") : t("vendor")}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-1">
          <Row label={t("language")} right={
            <div className="flex gap-1">
              <button onClick={() => setLang("en")} className={`px-3 py-1 text-xs rounded-lg ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>English</button>
              <button onClick={() => setLang("hi")} className={`px-3 py-1 text-xs rounded-lg ${lang === "hi" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>हिन्दी</button>
            </div>
          }/>
        </div>

        <Button variant="surface" size="lg" className="mt-6 w-full" onClick={() => { logout(); navigate({ to: "/" }); }}>
          {t("logout")}
        </Button>
      </main>
      <BottomNav />
    </div>
  );
}

function Row({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3">
      <span className="text-sm">{label}</span>
      {right}
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useApp } from "@/lib/app-store";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/TopBar";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { role, setRole } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (role) navigate({ to: "/dashboard" });
  }, [role, navigate]);

  return (
    <div className="min-h-screen flex flex-col px-6 pt-10 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center text-primary-foreground font-bold shadow-[var(--shadow-glow)]">B</div>
          <div className="font-semibold tracking-tight">{t("appName")}</div>
        </div>
        <LangToggle />
      </div>

      <div className="mt-12">
        <h1 className="text-3xl font-bold leading-tight">
          BrandMeasure <span className="bg-clip-text text-transparent bg-[image:var(--gradient-primary)]">Connect</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-[28ch]">{t("appTagline")}</p>
      </div>

      <div className="mt-10">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{t("chooseRole")}</div>
        <div className="space-y-3">
          <RoleCard
            title={t("agency")}
            desc={t("agencyDesc")}
            onClick={() => { setRole("agency"); navigate({ to: "/login" }); }}
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-7h6v7"/></svg>
            }
          />
          <RoleCard
            title={t("vendor")}
            desc={t("vendorDesc")}
            onClick={() => { setRole("vendor"); navigate({ to: "/login" }); }}
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7l3-4h12l3 4"/><path d="M3 7v13h18V7"/><path d="M9 12h6"/></svg>
            }
          />
        </div>
      </div>

      <div className="mt-auto pt-12 text-center text-[11px] text-muted-foreground">
        Made for India 🇮🇳 · Hindi & English
      </div>
    </div>
  );
}

function RoleCard({ title, desc, onClick, icon }: { title: string; desc: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-border bg-[image:var(--gradient-surface)] p-4 shadow-[var(--shadow-card)] hover:border-primary/50 hover:shadow-[var(--shadow-glow)] transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary grid place-items-center">{icon}</div>
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="M9 6l6 6-6 6"/></svg>
      </div>
    </button>
  );
}

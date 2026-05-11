import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/app-store";
import { useI18n } from "@/lib/i18n";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { role, setUser } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ name: role === "agency" ? "Aarav Mehta" : "Suresh Kumar", email });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar back={() => navigate({ to: "/" })} title={t("login")} />
      <form onSubmit={onSubmit} className="px-6 pt-6 pb-10 flex-1 flex flex-col">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{t(role === "agency" ? "agency" : "vendor")}</div>
          <h1 className="text-2xl font-bold mt-1">{t("welcome")}</h1>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@brand.in" className="h-12 rounded-xl bg-surface border-border" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">{t("password")}</Label>
            <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 rounded-xl bg-surface border-border" />
          </div>
        </div>

        <Button type="submit" variant="hero" size="xl" className="mt-8 w-full">{t("continueBtn")}</Button>

        {role === "vendor" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("noAccount")} <Link to="/register" className="text-primary font-medium">{t("signupHere")}</Link>
          </p>
        )}
      </form>
    </div>
  );
}

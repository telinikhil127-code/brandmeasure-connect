import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-store";
import { useI18n } from "@/lib/i18n";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { setUser, setRole } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", email: "", company: "", city: "", password: "" });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRole("vendor");
    setUser({ name: form.name || "Vendor", email: form.email });
    toast.success(t("registeredMsg"));
    navigate({ to: "/dashboard" });
  };

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar back={() => navigate({ to: "/login" })} title={t("register")} />
      <form onSubmit={onSubmit} className="px-6 pt-6 pb-10 flex-1 flex flex-col">
        <h1 className="text-2xl font-bold">{t("createAccount")}</h1>
        <p className="text-sm text-muted-foreground mt-1">Join our network of verified measurement vendors.</p>

        <div className="mt-6 space-y-4">
          <Field id="name" label={t("fullName")} value={form.name} onChange={upd("name")} required />
          <Field id="phone" label={t("phone")} value={form.phone} onChange={upd("phone")} type="tel" required placeholder="+91 ..." />
          <Field id="email" label={t("email")} value={form.email} onChange={upd("email")} type="email" required />
          <Field id="company" label={t("company")} value={form.company} onChange={upd("company")} required />
          <Field id="city" label={t("city")} value={form.city} onChange={upd("city")} required />
          <Field id="pw" label={t("password")} value={form.password} onChange={upd("password")} type="password" required />
        </div>

        <Button type="submit" variant="hero" size="xl" className="mt-8 w-full">{t("createAccount")}</Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("haveAccount")} <Link to="/login" className="text-primary font-medium">{t("loginHere")}</Link>
        </p>
      </form>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  const { label, id, ...rest } = props;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...rest} className="h-12 rounded-xl bg-surface border-border" />
    </div>
  );
}

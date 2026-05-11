import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-store";
import { useI18n } from "@/lib/i18n";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/assign")({
  component: AssignPage,
});

function AssignPage() {
  const { role, addTask } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  useEffect(() => { if (role !== "agency") navigate({ to: "/dashboard" }); }, [role, navigate]);

  const [form, setForm] = useState({ brand: "", site: "", city: "", deadline: "", payout: "" });
  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTask({
      id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
      brand: form.brand,
      site: form.site,
      city: form.city,
      deadline: form.deadline,
      payout: Number(form.payout) || 0,
      status: "new",
    });
    toast.success(t("taskCreated"));
    navigate({ to: "/tasks" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar back={() => navigate({ to: "/dashboard" })} title={t("assignNew")} />
      <form onSubmit={onSubmit} className="flex-1 px-4 pt-4 pb-10 space-y-4">
        <Field id="brand" label={t("brand")} value={form.brand} onChange={upd("brand")} required />
        <Field id="site" label={t("siteAddress")} value={form.site} onChange={upd("site")} required />
        <Field id="city" label={t("city")} value={form.city} onChange={upd("city")} required />
        <Field id="deadline" label={t("deadline")} value={form.deadline} onChange={upd("deadline")} placeholder="e.g. 15 May" required />
        <Field id="payout" label={`${t("payout")} (₹)`} value={form.payout} onChange={upd("payout")} type="number" required />
        <Button type="submit" variant="hero" size="xl" className="w-full">{t("create")}</Button>
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

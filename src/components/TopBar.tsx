import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center rounded-full border border-border bg-surface p-0.5 text-xs">
      <button
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 rounded-full transition-colors ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
      >EN</button>
      <button
        onClick={() => setLang("hi")}
        className={`px-2.5 py-1 rounded-full transition-colors ${lang === "hi" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
      >हिं</button>
    </div>
  );
}

export function TopBar({ title, right, back }: { title?: string; right?: React.ReactNode; back?: () => void }) {
  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          {back ? (
            <Button variant="ghost" size="icon" onClick={back} aria-label="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </Button>
          ) : (
            <div className="h-9 w-9 rounded-xl bg-[image:var(--gradient-primary)] grid place-items-center text-primary-foreground font-bold">B</div>
          )}
          <div className="font-semibold tracking-tight">{title ?? "BrandMeasure"}</div>
        </div>
        <div className="flex items-center gap-2">
          {right}
          <LangToggle />
        </div>
      </div>
    </header>
  );
}

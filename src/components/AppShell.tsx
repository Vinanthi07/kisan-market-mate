import { Link, useLocation } from "@tanstack/react-router";
import { BookOpen, Handshake, Languages, Moon, Sprout, Store, Sun, WifiOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { LANGS } from "@/lib/i18n";
import { useSettings } from "@/lib/store";

export function TopBar() {
  const { s, set, t } = useSettings();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-[1000] flex items-center gap-2 border-b bg-card px-3 py-2">
      <Store className="size-7 text-primary" aria-hidden />
      <span className="font-display text-xl font-bold text-foreground">{t.appName}</span>
      <div className="ml-auto flex gap-2">
        <button onClick={() => setOpen(!open)} aria-label={t.language} className="flex min-h-12 items-center gap-1 rounded-xl border px-3 text-base font-semibold">
          <Languages className="size-6" aria-hidden />
          <span>{LANGS.find((l) => l.code === s.lang)?.native}</span>
        </button>
        <button onClick={() => set({ theme: s.theme === "dark" ? "light" : "dark" })} aria-label={t.theme} className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border">
          {s.theme === "dark" ? <Sun className="size-6" /> : <Moon className="size-6" />}
        </button>
      </div>
      {open && (
        <div className="absolute right-3 top-full mt-1 grid w-56 gap-1 rounded-xl border bg-popover p-2 shadow-lg">
          {LANGS.map((l) => (
            <button key={l.code} onClick={() => { set({ lang: l.code }); setOpen(false); }}
              className={`min-h-12 rounded-lg px-3 text-left text-lg ${l.code === s.lang ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
              {l.native}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

export function OfflineBanner() {
  const { t } = useSettings();
  const [off, setOff] = useState(false);
  useEffect(() => {
    const u = () => setOff(!navigator.onLine); u();
    addEventListener("online", u); addEventListener("offline", u);
    return () => { removeEventListener("online", u); removeEventListener("offline", u); };
  }, []);
  if (!off) return null;
  return <div role="status" className="flex items-center gap-2 bg-warn px-3 py-2 text-warn-foreground"><WifiOff className="size-5" />{t.offline}</div>;
}

export function BottomNav() {
  const { t } = useSettings();
  const path = useLocation({ select: (l) => l.pathname });
  const items = [
    { to: "/sell", icon: Store, label: t.sell },
    { to: "/sow", icon: Sprout, label: t.sow },
    { to: "/buyers", icon: Handshake, label: t.buyers },
    { to: "/learn", icon: BookOpen, label: t.learn },
  ] as const;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] grid grid-cols-4 border-t bg-card" aria-label="Main">
      {items.map(({ to, icon: I, label }) => {
        const active = path === to;
        return (
          <Link key={to} to={to} className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${active ? "text-primary" : "text-muted-foreground"}`} aria-current={active ? "page" : undefined}>
            <I className="size-7" aria-hidden /><span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (<><TopBar /><OfflineBanner /><div className="mx-auto max-w-xl px-3 pb-24 pt-3">{children}</div><BottomNav /></>);
}

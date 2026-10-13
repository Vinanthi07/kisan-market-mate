import { Link, useLocation } from "@tanstack/react-router";
import {
  BookOpen,
  Calculator,
  Compass,
  FileText,
  GraduationCap,
  Handshake,
  HelpCircle,
  Home,
  Hourglass,
  Languages,
  LineChart,
  MapPin,
  Menu,
  Moon,
  ShieldAlert,
  Sprout,
  Store,
  Sun,
  Truck,
  User,
  WifiOff,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { LocationSelector } from "./LocationSelector";
import { LANGS, locationLabel } from "@/lib/i18n";
import { useSettings } from "@/lib/store";

export function TopBar() {
  const { s, set, t } = useSettings();
  const [langOpen, setLangOpen] = useState(false);
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-[50] flex items-center justify-between border-b bg-card/95 px-3 py-2.5 backdrop-blur-md shadow-2xs">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t.openNavigationMenu}
            className="flex size-10 items-center justify-center rounded-xl border bg-background hover:bg-muted md:hidden"
          >
            <Menu className="size-5 text-foreground" />
          </button>

          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Sprout className="size-5" />
            </div>
            <div>
              <span className="font-display text-lg font-extrabold tracking-tight text-foreground block leading-tight">
                {t.appName || "KisanSaathi"}
              </span>
              <span className="hidden sm:block text-[10px] font-semibold text-muted-foreground leading-none">
                {t.tagline || "Right Market. Right Time."}
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Top Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-muted-foreground">
          <Link
            to="/"
            className="rounded-lg px-2.5 py-1.5 transition-colors hover:text-foreground [&.active]:text-primary [&.active]:bg-primary/10"
          >
            {t.home || "Dashboard"}
          </Link>
          <Link
            to="/mandi-prices"
            className="rounded-lg px-2.5 py-1.5 transition-colors hover:text-foreground [&.active]:text-primary [&.active]:bg-primary/10"
          >
            {t.mandiPrices || "Mandi Prices"}
          </Link>
          <Link
            to="/best-market"
            className="rounded-lg px-2.5 py-1.5 transition-colors hover:text-foreground [&.active]:text-primary [&.active]:bg-primary/10"
          >
            {t.bestMarket || "Best Market"}
          </Link>
          <Link
            to="/when-to-sell"
            className="rounded-lg px-2.5 py-1.5 transition-colors hover:text-foreground [&.active]:text-primary [&.active]:bg-primary/10"
          >
            {t.whenToSell || "When to Sell"}
          </Link>
          <Link
            to="/calculator"
            className="rounded-lg px-2.5 py-1.5 transition-colors hover:text-foreground [&.active]:text-primary [&.active]:bg-primary/10"
          >
            {t.calculator || "Calculator"}
          </Link>
          <Link
            to="/lantana-guard"
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-amber-700 dark:text-amber-400 font-bold transition-colors hover:text-amber-800 [&.active]:bg-amber-50 dark:[&.active]:bg-amber-950/40"
          >
            <ShieldAlert className="size-3.5" />
            {t.lantanaGuard || "Lantana Guard"}
          </Link>
        </nav>

        {/* Right: Location, Language & Theme Controls */}
        <div className="flex items-center gap-1.5">
          {/* Location Badge */}
          <button
            type="button"
            onClick={() => setLocModalOpen(true)}
            aria-label={t.changeLocation || "Change location"}
            className="flex h-9 items-center gap-1.5 rounded-xl border bg-background px-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors max-w-[130px] sm:max-w-[180px] truncate"
          >
            <MapPin className="size-3.5 text-primary shrink-0" />
            <span className="truncate">{locationLabel(s.loc, t)}</span>
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen(!langOpen)}
              aria-label={t.language}
              className="flex h-9 items-center gap-1 rounded-xl border bg-background px-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <Languages className="size-3.5 text-primary" />
              <span>{LANGS.find((l) => l.code === s.lang)?.native.slice(0, 4)}</span>
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-1.5 grid w-48 gap-1 rounded-2xl border bg-popover p-1.5 shadow-xl z-[100]">
                <p className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t.selectLanguage || "Select Language"}
                </p>
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      set({ lang: l.code });
                      setLangOpen(false);
                    }}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors ${
                      l.code === s.lang
                        ? "bg-primary text-primary-foreground font-bold"
                        : "hover:bg-accent text-foreground"
                    }`}
                  >
                    <span>{l.native}</span>
                    <span className="text-xs opacity-75">{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => set({ theme: s.theme === "dark" ? "light" : "dark" })}
            aria-label={t.theme}
            className="flex size-9 items-center justify-center rounded-xl border bg-background hover:bg-muted transition-colors text-foreground"
          >
            {s.theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {/* All Features Menu Button (Desktop) */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t.allModules || "All Modules & Tools"}
            className="hidden md:flex h-9 items-center gap-1.5 rounded-xl border bg-background px-2.5 text-xs font-bold text-foreground hover:bg-muted"
          >
            <Menu className="size-4 text-primary" />
            <span>{t.modules || "Modules"}</span>
          </button>
        </div>
      </header>

      {/* Location Modal */}
      {locModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md">
            <div className="flex justify-end mb-1">
              <button
                type="button"
                onClick={() => setLocModalOpen(false)}
                className="rounded-full bg-card p-1 text-foreground shadow-sm hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <LocationSelector
              value={s.loc}
              onChange={(newLoc) => {
                set({ loc: newLoc });
                setLocModalOpen(false);
              }}
              onClose={() => setLocModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Full 13-Module Drawer / Navigation Modal */}
      {menuOpen && (
        <div className="fixed inset-0 z-[120] flex bg-black/60 backdrop-blur-xs">
          <div className="flex flex-col w-full max-w-sm bg-card h-full shadow-2xl border-r p-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b mb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sprout className="size-4" />
                </div>
                <div>
                  <h2 className="font-display text-base font-extrabold text-foreground leading-tight">
                    {t.appName || "KisanSaathi"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">{t.allModulesShort || "All Modules & Tools"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-1 hover:bg-muted text-muted-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="space-y-1 text-sm font-semibold">
              {[
                {
                  to: "/",
                  icon: Home,
                  label: t.home || "Home Dashboard",
                  desc: t.overviewQuickActions || "Overview & quick actions",
                },
                {
                  to: "/mandi-prices",
                  icon: Store,
                  label: t.mandiPrices || "KisanMandi Prices",
                  desc: t.liveApmcRates || "Live APMC modal rates",
                },
                {
                  to: "/best-market",
                  icon: Compass,
                  label: t.bestMarket || "Best Market Finder",
                  desc: t.netAfterTransport || "Net proceeds after transport",
                },
                {
                  to: "/when-to-sell",
                  icon: Hourglass,
                  label: t.whenToSell || "When to Sell",
                  desc: t.trendSupport || "Trend & storage decision support",
                },
                {
                  to: "/trends",
                  icon: LineChart,
                  label: t.trends || "Price Trends & Planning",
                  desc: t.historicalCharts || "60-day historical charts & crop planner",
                },
                {
                  to: "/calculator",
                  icon: Calculator,
                  label: t.calculator || "Farming Profit Calculator",
                  desc: t.cultivationBreakEven || "Cost of cultivation & break-even",
                },
                {
                  to: "/buyers",
                  icon: Handshake,
                  label: t.buyers || "Direct Buyer Market",
                  desc: t.fpoConnect || "Connect with FPOs & aggregators",
                },
                {
                  to: "/fertilizer",
                  icon: Sprout,
                  label: t.fertilizer || "Organic Fertilizer & Manure",
                  desc: t.vermiInputs || "Vermicompost & bio-inputs",
                },
                {
                  to: "/workshops",
                  icon: GraduationCap,
                  label: t.workshops || "Training & Workshops",
                  desc: t.extensionLearning || "Extension learning sessions",
                },
                {
                  to: "/transport",
                  icon: Truck,
                  label: t.transport || "Transport Coordination",
                  desc: t.vehiclePooling || "Vehicle matching & load pooling",
                },
                {
                  to: "/lantana-guard",
                  icon: ShieldAlert,
                  label: t.lantanaGuard || "Lantana Eco-Guard",
                  desc: t.researchPilotModuleDesc || "Research-pilot grain storage module",
                  highlight: true,
                },
                {
                  to: "/profile",
                  icon: User,
                  label: t.profile || "Farmer Profile & Settings",
                  desc: t.profilePreferences || "Preferences, crops & saved data",
                },
                {
                  to: "/about",
                  icon: HelpCircle,
                  label: t.about || "Help & Data Sources",
                  desc: t.helpSources || "Agmarknet details & disclaimers",
                },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-start gap-3 rounded-xl p-2.5 transition-colors ${
                    item.highlight
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <item.icon
                    className={`size-5 shrink-0 mt-0.5 ${item.highlight ? "text-amber-600" : "text-primary"}`}
                  />
                  <div>
                    <span className="block font-bold leading-tight">{item.label}</span>
                    <span className="block text-[11px] font-normal text-muted-foreground">
                      {item.desc}
                    </span>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-1" onClick={() => setMenuOpen(false)} />
        </div>
      )}
    </>
  );
}

export function OfflineBanner() {
  const { t } = useSettings();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    handleStatus();
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs"
    >
      <WifiOff className="size-4 shrink-0" />
      <span>{t.offline || "Offline Mode: Showing cached agricultural data."}</span>
    </div>
  );
}

export function BottomNav() {
  const { t } = useSettings();
  const path = useLocation({ select: (l) => l.pathname });

  const items = [
    { to: "/", icon: Home, label: t.home || "Home" },
    { to: "/best-market", icon: Compass, label: t.bestMarket || "Best Market" },
    { to: "/mandi-prices", icon: Store, label: t.mandiPrices || "Mandis" },
    { to: "/calculator", icon: Calculator, label: t.calculator || "Calculator" },
    { to: "/profile", icon: User, label: t.profile || "Profile" },
  ] as const;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[40] grid grid-cols-5 border-t bg-card/98 backdrop-blur-md md:hidden safe-area-pb"
      aria-label={t.mainNavigation}
    >
      {items.map(({ to, icon: Icon, label }) => {
        const active = path === to || (to === "/" && path === "");
        return (
          <Link
            key={to}
            to={to}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-bold transition-colors ${
              active ? "text-primary font-extrabold" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-5" aria-hidden />
            <span className="truncate max-w-[64px] text-center">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TopBar />
      <OfflineBanner />
      <div className="flex-1 mx-auto w-full max-w-5xl px-3 sm:px-4 md:px-6 pt-3 pb-24 md:pb-12">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

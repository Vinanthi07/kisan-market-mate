import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, CalendarClock, Check, Coins, Handshake, Hourglass, IndianRupee, Leaf, MapPin, Minus, Plus, Receipt, Route as RouteIcon, ShieldAlert, Truck, X } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Page } from "@/components/AppShell";
import { CropPicker } from "@/components/CropPicker";
import { ListenButton } from "@/components/ListenButton";
import { rankMarkets, rupees, waitAdvice, type Ranked, type Status } from "@/lib/calc";
import { CROPS, PRICE_DATE, cropById, marketName } from "@/lib/data";
import { fmt } from "@/lib/i18n";
import { useSettings } from "@/lib/store";

const MandiMap = lazy(() => import("@/components/MandiMap"));

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell — KisanMandi" },
      { name: "description", content: "Ranked mandis by net price after transport, fees and spoilage." },
      { property: "og:title", content: "Sell — KisanMandi" },
      { property: "og:description", content: "See which mandi pays the most today and whether to wait." },
    ],
  }),
  component: Sell,
});

export function StatusIcon({ s, label }: { s: Status; label: string }) {
  const I = s === "best" ? Check : s === "okay" ? Minus : X;
  const c = s === "best" ? "bg-good text-good-foreground" : s === "okay" ? "bg-warn text-warn-foreground" : "bg-bad text-bad-foreground";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-bold ${c}`}><I className="size-4" aria-hidden />{label}</span>;
}

function Sell() {
  const { s, set, t, ready } = useSettings();
  const [sel, setSel] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const crop = cropById(s.crop);
  const loc: [number, number] = s.loc ? [s.loc.lat, s.loc.lng] : [13.14, 78.13];
  const rate = s.myVehicle ? s.vehicleRate : s.rate;
  const rows = useMemo(() => rankMarkets(crop, s.qty, loc, rate), [crop, s.qty, loc[0], loc[1], rate]); // eslint-disable-line react-hooks/exhaustive-deps
  const best = rows[0];
  const advice = best ? waitAdvice(best.series, crop, s.qty) : null;
  const onSelect = useCallback((id: string) => setSel(id), []);

  useEffect(() => { if (rows.length) localStorage.setItem("kisanmandi.lastPrices", JSON.stringify({ date: PRICE_DATE, crop: s.crop, rows: rows.map((r) => ({ id: r.market.id, price: r.price })) })); }, [rows, s.crop]);

  const voice = best ? [
    fmt(t.voiceBest, { m: marketName(best.market, s.lang), p: Math.round(best.net) }),
    best.extra > 0 ? fmt(t.voiceExtra, { g: best.extra }) : "",
    advice && advice.days ? fmt(t.voiceWait, { n: advice.days, g: advice.gain }) : t.voiceSell,
  ].join(" ") : t.empty;

  if (!ready) return <Page><p className="p-6 text-center text-lg">{t.loading}</p></Page>;

  return (
    <Page>
      <main className="grid gap-4">
        <CropPicker value={s.crop} onChange={(c) => { set({ crop: c }); setSel(null); }} />

        <div className="flex items-center gap-2 rounded-2xl border bg-card p-3">
          <Coins className="size-7 text-primary" aria-hidden />
          <span className="text-lg font-semibold">{t.quantity}</span>
          <div className="ml-auto flex items-center gap-2">
            <button aria-label="-" onClick={() => set({ qty: Math.max(1, s.qty - 1) })} className="flex size-12 items-center justify-center rounded-xl border"><Minus className="size-6" /></button>
            <input aria-label={t.quantity} type="number" inputMode="decimal" min={1} value={s.qty} onChange={(e) => set({ qty: Math.max(1, Number(e.target.value) || 1) })} className="h-12 w-20 rounded-xl border bg-background text-center text-2xl font-bold" />
            <button aria-label="+" onClick={() => set({ qty: s.qty + 1 })} className="flex size-12 items-center justify-center rounded-xl border"><Plus className="size-6" /></button>
          </div>
          <span className="text-base">{t.quintal}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-3">
          <Truck className="size-7 text-primary" aria-hidden />
          <label className="flex items-center gap-2 text-base">{t.rate}
            <input type="number" step="0.1" min={0} value={s.myVehicle ? s.vehicleRate : s.rate}
              onChange={(e) => set(s.myVehicle ? { vehicleRate: Number(e.target.value) } : { rate: Number(e.target.value) })}
              className="h-12 w-20 rounded-xl border bg-background text-center text-xl font-bold" /></label>
          <label className="flex min-h-12 items-center gap-2 text-base font-semibold">
            <input type="checkbox" className="size-6" checked={s.myVehicle} onChange={(e) => set({ myVehicle: e.target.checked })} />{t.myVehicle}</label>
        </div>

        {s.loc && <p className="flex items-center gap-2 text-base text-muted-foreground"><MapPin className="size-5" />{s.loc.village || s.loc.district} {s.loc.district && `· ${s.loc.district}`}</p>}

        {best && advice && (
          <section aria-live="polite" className={`rounded-2xl p-4 ${advice.days ? "bg-warn text-warn-foreground" : "bg-good text-good-foreground"}`}>
            <div className="flex items-center gap-3">
              {advice.days ? <Hourglass className="size-10" aria-hidden /> : <BadgeCheck className="size-10" aria-hidden />}
              <div>
                <p className="font-display text-3xl font-extrabold">{advice.days ? fmt(t.wait, { n: advice.days }) : t.sellNow}</p>
                {advice.days > 0 && <p className="text-lg font-semibold">{t.gain}: +{rupees(advice.gain)}</p>}
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1 text-sm"><ShieldAlert className="size-4" />{t.disclaimer}</p>
            <ListenButton text={voice} className="mt-3" />
          </section>
        )}

        <ShelfTable />

        {mounted && rows.length > 0 && (
          <Suspense fallback={<div className="flex h-72 items-center justify-center rounded-2xl border bg-muted">{t.loading}</div>}>
            <MandiMap center={loc} items={rows} selected={sel} onSelect={onSelect} />
          </Suspense>
        )}

        <p className="flex items-center gap-2 text-base text-muted-foreground"><CalendarClock className="size-5" />{t.updated}: {PRICE_DATE}</p>

        {rows.length === 0 && <p className="flex items-center gap-2 rounded-2xl bg-muted p-4 text-lg"><X className="size-6" />{t.empty}</p>}

        <ol className="grid gap-3">
          {rows.map((r, i) => <MarketCard key={r.market.id} r={r} rank={i + 1} active={sel === r.market.id} onClick={() => setSel(r.market.id)} />)}
        </ol>
      </main>
    </Page>
  );
}

function MarketCard({ r, rank, active, onClick }: { r: Ranked; rank: number; active: boolean; onClick: () => void }) {
  const { s, t } = useSettings();
  const label = { best: t.best, okay: t.okay, poor: t.poor }[r.status];
  const row = (I: typeof Truck, l: string, v: string) => (
    <div className="flex items-center gap-2 text-base"><I className="size-5 text-muted-foreground" aria-hidden /><span className="text-muted-foreground">{l}</span><span className="ml-auto font-bold">{v}</span></div>
  );
  return (
    <li>
      <button onClick={onClick} aria-pressed={active} className={`w-full rounded-2xl border-2 bg-card p-3 text-left ${active ? "border-primary" : "border-border"}`}>
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-extrabold text-primary-foreground">{rank}</span>
          <div className="min-w-0">
            <p className="truncate text-xl font-bold">{marketName(r.market, s.lang)}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <StatusIcon s={r.status} label={label} />
              {r.market.kind === "direct" && <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-sm font-bold text-accent-foreground"><Handshake className="size-4" />{t.direct}</span>}
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="font-display text-3xl font-extrabold text-primary">{rupees(r.net)}</p>
            <p className="text-sm text-muted-foreground">{t.net}</p>
          </div>
        </div>
        {r.extra > 0 && <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-good px-3 py-1 text-base font-bold text-good-foreground"><Plus className="size-4" />{rupees(r.extra)} {t.extra}</p>}
        <div className="mt-2 grid gap-1">
          {row(RouteIcon, t.distance, `${Math.round(r.distanceKm)} ${t.km}`)}
          {row(IndianRupee, t.price, rupees(r.price))}
          {row(Truck, t.transport, "−" + rupees(r.transport))}
          {row(Receipt, t.fees, "−" + rupees(r.fee))}
          {row(Leaf, t.spoilage, "−" + rupees(r.spoil))}
        </div>
      </button>
    </li>
  );
}

function ShelfTable() {
  const { t } = useSettings();
  return (
    <details className="rounded-2xl border bg-card p-3">
      <summary className="flex min-h-12 cursor-pointer items-center gap-2 text-lg font-semibold"><Hourglass className="size-6 text-primary" />{t.shelf}</summary>
      <table className="mt-2 w-full text-base">
        <thead><tr className="text-left text-muted-foreground"><th className="py-1"></th><th>{t.normal}</th><th>{t.lantana}</th></tr></thead>
        <tbody>{CROPS.map((c) => <tr key={c.id} className="border-t"><td className="py-2 font-semibold">{t[c.id]}</td><td>{c.shelfNormal}</td><td>{c.shelfLantana}</td></tr>)}</tbody>
      </table>
      <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><ShieldAlert className="size-4" />{t.lantanaNote}</p>
    </details>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Sprout } from "lucide-react";
import { useState } from "react";
import { Page } from "@/components/AppShell";
import { CropArt } from "@/components/CropArt";
import { ListenButton } from "@/components/ListenButton";
import { rupees } from "@/lib/calc";
import { CROPS, MARKETS, priceSeries, type CropId } from "@/lib/data";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/sow")({
  head: () => ({
    meta: [
      { title: "What to sow — KisanMandi" },
      { name: "description", content: "Crops ranked by expected profit per acre this season." },
      { property: "og:title", content: "What to sow — KisanMandi" },
      { property: "og:description", content: "Expected profit per acre from historical mandi prices." },
    ],
  }),
  component: Sow,
});

function Sow() {
  const { t } = useSettings();
  const [edits, setEdits] = useState<Record<CropId, { y: number; c: number }>>(
    () => Object.fromEntries(CROPS.map((c) => [c.id, { y: c.yieldQ, c: c.inputCost }])) as Record<CropId, { y: number; c: number }>);
  const rows = CROPS.map((c) => {
    const mandis = MARKETS.filter((m) => m.kind === "mandi");
    const avg = mandis.reduce((a, m) => { const s = priceSeries(c, m); return a + s.reduce((x, y) => x + y, 0) / s.length; }, 0) / mandis.length;
    return { c, avg, profit: avg * edits[c.id].y - edits[c.id].c };
  }).sort((a, b) => b.profit - a.profit);
  const max = Math.max(...rows.map((r) => Math.abs(r.profit)));
  return (
    <Page>
      <main className="grid gap-3">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold"><Sprout className="size-7 text-primary" />{t.sowTitle}</h1>
        <ListenButton text={rows.slice(0, 3).map((r) => `${t[r.c.id]} ${Math.round(r.profit)}`).join(". ")} />
        {rows.map(({ c, profit }) => (
          <div key={c.id} className="rounded-2xl border bg-card p-3">
            <div className="flex items-center gap-3">
              <CropArt id={c.id} size={56} />
              <div className="flex-1">
                <p className="text-lg font-bold">{t[c.id]}</p>
                <div className="mt-1 h-5 rounded-full bg-muted"><div className={`h-5 rounded-full ${profit >= 0 ? "bg-good" : "bg-bad"}`} style={{ width: `${(Math.abs(profit) / max) * 100}%` }} /></div>
              </div>
              <p className="text-right font-display text-2xl font-extrabold">{rupees(profit)}<span className="block text-sm font-normal text-muted-foreground">{t.perAcre}</span></p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-base">
              <label className="grid gap-1">{t.yieldL}<input type="number" className="h-12 rounded-xl border bg-background px-2 text-lg" value={edits[c.id].y} onChange={(e) => setEdits({ ...edits, [c.id]: { ...edits[c.id], y: Number(e.target.value) } })} /></label>
              <label className="grid gap-1">{t.cost}<input type="number" className="h-12 rounded-xl border bg-background px-2 text-lg" value={edits[c.id].c} onChange={(e) => setEdits({ ...edits, [c.id]: { ...edits[c.id], c: Number(e.target.value) } })} /></label>
            </div>
          </div>
        ))}
      </main>
    </Page>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BadgeAlert,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  HelpCircle,
  Hourglass,
  Info,
  Scale,
  ShieldAlert,
  Sparkles,
  Sprout,
  Store,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Page } from "@/components/AppShell";
import { CropArt } from "@/components/CropArt";
import { CropPicker } from "@/components/CropPicker";
import { ListenButton } from "@/components/ListenButton";
import { evaluateWhenToSell, rupees, type WhenToSellAdvisory } from "@/lib/calc";
import { CROPS, cropById, MARKETS, priceSeries, type CropId } from "@/lib/data";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/when-to-sell")({
  head: () => ({
    meta: [
      { title: "When to Sell — Decision Support | KisanSaathi" },
      {
        name: "description",
        content:
          "Transparent sell-now-or-wait advisory using 3-day and 7-day APMC moving averages, perishability risk assessment and storage deterioration limits.",
      },
    ],
  }),
  component: WhenToSellPage,
});

function WhenToSellPage() {
  const { s, set, t } = useSettings();
  const [selectedCropId, setSelectedCropId] = useState<CropId>(s.crop);
  const [selectedMarketId, setSelectedMarketId] = useState<string>("klr");
  const [holdingQuantity, setHoldingQuantity] = useState<number>(s.qty || 10);
  const [hasUrgentCashNeed, setHasUrgentCashNeed] = useState<boolean>(false);
  const [hasGoodVentilatedStorage, setHasGoodVentilatedStorage] = useState<boolean>(true);

  const crop = useMemo(() => cropById(selectedCropId), [selectedCropId]);
  const market = useMemo(
    () => MARKETS.find((m) => m.id === selectedMarketId) ?? MARKETS[0],
    [selectedMarketId],
  );

  // Generate 30 days price series for the selected crop & market
  const historySeries = useMemo(() => {
    return priceSeries(crop, market, 30);
  }, [crop, market]);

  // Evaluate When to Sell advisory using the analytical engine
  const advisory: WhenToSellAdvisory = useMemo(() => {
    return evaluateWhenToSell(historySeries, crop, holdingQuantity);
  }, [historySeries, crop, holdingQuantity]);

  const currentPrice = historySeries[historySeries.length - 1] ?? crop.basePrice;

  // Determine final adjusted advice taking farmer constraints into account
  const finalRecommendation = useMemo(() => {
    if (crop.perishability === "high") {
      return {
        action: "SELL PROMPTLY",
        badge: "High Perishability Risk",
        color: "bg-destructive text-destructive-foreground",
        reason: `${crop.name} deteriorates rapidly within ${crop.shelfNormal} days. Even if price trends are rising, quality deductions and weight loss will erode gains.`,
      };
    }
    if (hasUrgentCashNeed) {
      return {
        action: "SELL NOW FOR LIQUIDITY",
        badge: "Immediate Cash Requirement",
        color: "bg-amber-600 text-white",
        reason:
          "When immediate working capital or loan repayments are due, price speculations carry unnecessary distress risk.",
      };
    }
    if (!hasGoodVentilatedStorage) {
      return {
        action: "SELL NOW — STORAGE INADEQUATE",
        badge: "Risk of Storage Spoilage",
        color: "bg-amber-600 text-white",
        reason:
          "Without moisture-controlled, pest-protected storage, holding produce risks mold, weevil infestation and sprouting.",
      };
    }
    if (advisory.direction === "increasing") {
      return {
        action: "CONSIDER HOLDING (SAFE STORAGE)",
        badge: "Upward Momentum",
        color: "bg-emerald-700 text-white",
        reason: advisory.detailedExplanation,
      };
    }
    if (advisory.direction === "decreasing") {
      return {
        action: "SELL NOW — TREND WEAKENING",
        badge: "Downward Trajectory",
        color: "bg-destructive text-white",
        reason: advisory.detailedExplanation,
      };
    }
    return {
      action: "EXERCISE CAUTION / COMPARE LOCALLY",
      badge: "Range-Bound Market",
      color: "bg-muted text-foreground",
      reason: advisory.detailedExplanation,
    };
  }, [crop, hasUrgentCashNeed, hasGoodVentilatedStorage, advisory]);

  const voiceText = useMemo(() => {
    return `When to sell assessment for ${crop.localizedNames[s.lang] ?? crop.name} at ${
      market.names[s.lang] ?? market.names.en
    }: Recent 3-day average is ${advisory.average3Day} rupees, and 7-day average is ${
      advisory.average7Day
    } rupees. ${advisory.directionLabel} Recommendation: ${finalRecommendation.action}. ${finalRecommendation.reason}`;
  }, [crop, market, advisory, finalRecommendation, s.lang]);

  return (
    <Page>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Hourglass className="size-6 text-primary" />
              <h1 className="font-display text-2xl font-extrabold text-foreground">
                {t.whenToSell || "When to Sell — Decision Support"}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Transparent price trajectory analysis balanced against perishability and holding
              costs.
            </p>
          </div>

          <ListenButton text={voiceText} className="self-start sm:self-auto text-xs py-1.5" />
        </div>

        {/* Inputs */}
        <div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Select Crop
            </label>
            <CropPicker
              value={selectedCropId}
              onChange={(c) => setSelectedCropId(c)}
              grid={false}
              showCategoryFilter={true}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Reference APMC Mandi
              </label>
              <select
                value={selectedMarketId}
                onChange={(e) => setSelectedMarketId(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary"
              >
                {MARKETS.filter((m) => m.kind === "mandi").map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.names.en} ({m.district}, {m.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Harvest Quantity in Quintals
              </label>
              <input
                type="number"
                min={1}
                value={holdingQuantity}
                onChange={(e) => setHoldingQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Farmer Real-World Constraints */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t text-xs">
            <label className="flex items-center gap-2 rounded-xl border bg-muted/20 p-2.5 font-semibold text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasUrgentCashNeed}
                onChange={(e) => setHasUrgentCashNeed(e.target.checked)}
                className="size-4 rounded text-primary"
              />
              <span>I have urgent cash requirements (loans / bills)</span>
            </label>

            <label className="flex items-center gap-2 rounded-xl border bg-muted/20 p-2.5 font-semibold text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasGoodVentilatedStorage}
                onChange={(e) => setHasGoodVentilatedStorage(e.target.checked)}
                className="size-4 rounded text-primary"
              />
              <span>I have dry, rodent-safe ventilated storage available</span>
            </label>
          </div>
        </div>

        {/* Primary Advisory Card */}
        <section className="rounded-3xl border-2 border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${finalRecommendation.color}`}
              >
                {finalRecommendation.badge}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-foreground">
                {finalRecommendation.action}
              </h2>
            </div>

            <div className="text-left sm:text-right">
              <span className="block text-xs text-muted-foreground font-semibold">
                Latest Modal Price
              </span>
              <span className="font-display text-2xl font-extrabold text-foreground">
                ₹{currentPrice} / quintal
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed rounded-2xl bg-muted/30 p-3.5 border">
            {finalRecommendation.reason}
          </p>

          {/* Transparent Moving Average Comparison Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div className="rounded-xl border bg-card p-3">
              <span className="block text-[11px] text-muted-foreground">3-Day Average</span>
              <span className="text-base font-extrabold text-foreground">
                {advisory.average3Day ? `₹${advisory.average3Day}/q` : "N/A"}
              </span>
            </div>

            <div className="rounded-xl border bg-card p-3">
              <span className="block text-[11px] text-muted-foreground">7-Day Average</span>
              <span className="text-base font-extrabold text-foreground">
                {advisory.average7Day ? `₹${advisory.average7Day}/q` : "N/A"}
              </span>
            </div>

            <div className="rounded-xl border bg-card p-3">
              <span className="block text-[11px] text-muted-foreground">Safe Farm Shelf Life</span>
              <span className="text-base font-extrabold text-foreground">
                {crop.shelfNormal} days max
              </span>
            </div>

            <div className="rounded-xl border bg-card p-3">
              <span className="block text-[11px] text-muted-foreground">Est. Holding Cost</span>
              <span className="text-base font-extrabold text-foreground">
                ₹{advisory.estimatedStorageCostPerDay}/day
              </span>
            </div>
          </div>
        </section>

        {/* Perishability & Storage Safeguard Warning */}
        {crop.perishability === "high" && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
            <AlertTriangle className="size-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold">High Perishability Warning: Do Not Hold</h3>
              <p className="leading-relaxed">
                {crop.name} is a highly perishable commodity with high moisture content. Holding
                produce in farm sheds for speculative future price rises leads to shrinkage, rot,
                and severe market dockage. Agricultural extension guidelines recommend immediate
                marketing.
              </p>
            </div>
          </div>
        )}

        {/* Rigorous Transparency Notice (Per Master Prompt) */}
        <section className="rounded-2xl border border-amber-300/80 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800/50 p-4 text-xs text-amber-950 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldAlert className="size-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>Important Advisory Disclaimer & Methodology</span>
          </div>
          <p className="leading-relaxed">
            Historical moving averages reflect past recorded arrivals and{" "}
            <strong>do not guarantee future price movements</strong>. Agricultural markets are
            subject to sudden shifts in weather, inter-state arrivals, transport bottlenecks, and
            festival demand. Always verify today's prevailing spot bids at your local APMC yard
            before making a dispatch commitment.
          </p>
        </section>
      </div>
    </Page>
  );
}

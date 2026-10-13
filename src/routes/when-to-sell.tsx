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
import { fmt } from "@/lib/i18n";
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
        action: t.sellPromptlyAction,
        badge: t.sellPromptlyBadge,
        color: "bg-destructive text-destructive-foreground",
        reason: fmt(t.sellPromptlyReason, {
          crop: crop.localizedNames[s.lang] ?? crop.name,
          days: crop.shelfNormal,
        }),
      };
    }
    if (hasUrgentCashNeed) {
      return {
        action: t.urgentSellAction,
        badge: t.urgentSellBadge,
        color: "bg-amber-600 text-white",
        reason: t.urgentSellReason,
      };
    }
    if (!hasGoodVentilatedStorage) {
      return {
        action: t.inadequateStorageAction,
        badge: t.inadequateStorageBadge,
        color: "bg-amber-600 text-white",
        reason: t.inadequateStorageReason,
      };
    }
    if (advisory.direction === "increasing") {
      return {
        action: t.considerHoldingAction,
        badge: t.upwardMomentumBadge,
        color: "bg-emerald-700 text-white",
        reason: fmt(t.risingAdviceBody, {
          avg3: advisory.average3Day ?? currentPrice,
          avg7: advisory.average7Day ?? currentPrice,
          days: advisory.safeStorageLimitDays,
          cost: advisory.estimatedStorageCostPerDay,
        }),
      };
    }
    if (advisory.direction === "decreasing") {
      return {
        action: t.weakeningTrendAction,
        badge: t.downwardTrajectoryBadge,
        color: "bg-destructive text-white",
        reason: fmt(t.fallingAdviceBody, {
          avg3: advisory.average3Day ?? currentPrice,
          avg7: advisory.average7Day ?? currentPrice,
          cost: advisory.estimatedStorageCostPerDay,
        }),
      };
    }
    return {
      action: t.cautionCompareAction,
      badge: t.rangeBoundBadge,
      color: "bg-muted text-foreground",
      reason: t.mixedAdviceBody,
    };
  }, [crop, hasUrgentCashNeed, hasGoodVentilatedStorage, advisory, t, s.lang, currentPrice]);

  const voiceText = useMemo(() => {
    return `${t.whenToSell}: ${crop.localizedNames[s.lang] ?? crop.name}, ${market.names[s.lang] ?? market.names.en}. ${t.threeDayAvg}: ${advisory.average3Day ?? t.empty}. ${t.sevenDayAvg}: ${advisory.average7Day ?? t.empty}. ${finalRecommendation.action}. ${finalRecommendation.reason}`;
  }, [crop, market, advisory, finalRecommendation, s.lang, t]);

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
              {t.routeIntroSell}
            </p>
          </div>

          <ListenButton text={voiceText} className="self-start sm:self-auto text-xs py-1.5" />
        </div>

        {/* Inputs */}
        <div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              {t.chooseCrop}
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
                {t.referenceMandi}
              </label>
              <select
                value={selectedMarketId}
                onChange={(e) => setSelectedMarketId(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary"
              >
                {MARKETS.filter((m) => m.kind === "mandi").map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.names[s.lang] ?? m.names.en} ({m.district}, {m.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {t.harvestQuantity}
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
              <span>{t.urgentCashNeed}</span>
            </label>

            <label className="flex items-center gap-2 rounded-xl border bg-muted/20 p-2.5 font-semibold text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasGoodVentilatedStorage}
                onChange={(e) => setHasGoodVentilatedStorage(e.target.checked)}
                className="size-4 rounded text-primary"
              />
              <span>{t.safeStorageAvailable}</span>
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
                {t.latestModalPrice}
              </span>
              <span className="font-display text-2xl font-extrabold text-foreground">
                ₹{currentPrice} / {t.quintal}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed rounded-2xl bg-muted/30 p-3.5 border">
            {finalRecommendation.reason}
          </p>

          {/* Transparent Moving Average Comparison Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div className="rounded-xl border bg-card p-3">
              <span className="block text-[11px] text-muted-foreground">{t.threeDayAvg}</span>
              <span className="text-base font-extrabold text-foreground">
                {advisory.average3Day ? `₹${advisory.average3Day}/q` : t.empty}
              </span>
            </div>

            <div className="rounded-xl border bg-card p-3">
              <span className="block text-[11px] text-muted-foreground">{t.sevenDayAvg}</span>
              <span className="text-base font-extrabold text-foreground">
                {advisory.average7Day ? `₹${advisory.average7Day}/q` : t.empty}
              </span>
            </div>

            <div className="rounded-xl border bg-card p-3">
              <span className="block text-[11px] text-muted-foreground">{t.safeShelfLife}</span>
              <span className="text-base font-extrabold text-foreground">
                {crop.shelfNormal} {t.daysUnit}
              </span>
            </div>

            <div className="rounded-xl border bg-card p-3">
              <span className="block text-[11px] text-muted-foreground">{t.estimatedHoldingCost}</span>
              <span className="text-base font-extrabold text-foreground">
                ₹{advisory.estimatedStorageCostPerDay} / {t.perDayUnit}
              </span>
            </div>
          </div>
        </section>

        {/* Perishability & Storage Safeguard Warning */}
        {crop.perishability === "high" && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
            <AlertTriangle className="size-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold">{t.highPerishabilityWarning}</h3>
              <p className="leading-relaxed">
                {fmt(t.perishabilityWarningBody, { crop: crop.localizedNames[s.lang] ?? crop.name })}
              </p>
            </div>
          </div>
        )}

        {/* Rigorous Transparency Notice (Per Master Prompt) */}
        <section className="rounded-2xl border border-amber-300/80 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800/50 p-4 text-xs text-amber-950 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldAlert className="size-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>{t.advisoryMethodologyTitle}</span>
          </div>
          <p className="leading-relaxed">
            {t.advisoryMethodologyBody}
          </p>
        </section>
      </div>
    </Page>
  );
}

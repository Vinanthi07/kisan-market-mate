import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calculator,
  Compass,
  FileText,
  GraduationCap,
  Handshake,
  Hourglass,
  IndianRupee,
  Languages,
  LineChart,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Sprout,
  Store,
  TrendingUp,
  Truck,
  Volume2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Page } from "@/components/AppShell";
import { CropArt } from "@/components/CropArt";
import { CropPicker } from "@/components/CropPicker";
import { ListenButton } from "@/components/ListenButton";
import { LocationSelector } from "@/components/LocationSelector";
import {
  approximateRoadKm,
  calculateNetProceeds,
  convertPrice,
  convertQuantity,
  rupees,
} from "@/lib/calc";
import { CROPS, cropById, MARKETS, priceSeries, type CropId } from "@/lib/data";
import { fmt, locationLabel } from "@/lib/i18n";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KisanSaathi — Right Market. Right Time. Better Income." },
      {
        name: "description",
        content:
          "Mobile-first agricultural intelligence platform: APMC mandi prices, best market finder, profit calculator, transport pooling and research-backed safe storage.",
      },
    ],
  }),
  component: HomeDashboard,
});

function HomeDashboard() {
  const { s, set, t, ready } = useSettings();
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const selectedCrop = useMemo(() => cropById(s.crop), [s.crop]);
  const userCoords: [number, number] = useMemo(
    () => (s.loc ? [s.loc.lat, s.loc.lng] : [13.14, 78.13]),
    [s.loc],
  );

  // Compute live price highlights for the selected crop across nearby mandis
  const marketHighlights = useMemo(() => {
    const mandis = MARKETS.filter((m) => m.kind === "mandi");
    const evaluated = mandis.map((m) => {
      const s7 = priceSeries(selectedCrop, m, 7);
      const latestPrice = s7[s7.length - 1] ?? selectedCrop.basePrice;
      const prevPrice = s7[s7.length - 2] ?? latestPrice;
      const dist = m.fixedKm ?? approximateRoadKm(userCoords, [m.lat, m.lng]);
      const change = latestPrice - prevPrice;

      // Net proceeds for 10 quintals
      const breakdown = calculateNetProceeds({
        pricePerUnit: latestPrice,
        quantity: 10,
        unit: "quintal",
        transportCost: Math.round(dist * 1.8 * 10),
        marketFees: Math.round(0.015 * latestPrice * 10),
        loadingUnloadingCharges: 150,
        packagingCosts: 100,
        otherSellingExpenses: Math.round(
          latestPrice * 10 * selectedCrop.spoilPer100km * (dist / 100),
        ),
      });

      return {
        market: m,
        price: latestPrice,
        dist,
        change,
        netFor10Q: breakdown.netProceeds,
        netPerQ: breakdown.netProceedsPerUnit,
      };
    });

    // Sort by net proceeds
    evaluated.sort((a, b) => b.netFor10Q - a.netFor10Q);
    const topMarket = evaluated[0];
    const nearestMarket = [...evaluated].sort((a, b) => a.dist - b.dist)[0];
    const spread =
      topMarket && nearestMarket ? Math.round((topMarket.netPerQ - nearestMarket.netPerQ) * 10) : 0;

    return {
      top: topMarket,
      nearest: nearestMarket,
      spread,
      all: evaluated.slice(0, 4),
    };
  }, [selectedCrop, userCoords]);

  const voiceSummaryText = useMemo(() => {
    if (!marketHighlights.top) return t.empty || "No market data available.";
    const topName =
      marketHighlights.top.market.names[s.lang] ?? marketHighlights.top.market.names.en;
    const price = Math.round(marketHighlights.top.netPerQ);
    const summary = fmt(t.voiceBest, { m: topName, p: price });
    return marketHighlights.spread > 0
      ? `${summary} ${fmt(t.voiceExtra, { g: marketHighlights.spread })}`
      : summary;
  }, [marketHighlights, s.lang, t.voiceBest, t.voiceExtra]);

  if (!ready) {
    return (
      <Page>
        <div className="flex h-64 items-center justify-center">
          <p className="text-base font-semibold text-muted-foreground animate-pulse">{t.loading}</p>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="space-y-6">
        {/* Hero Welcome Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-green-800 to-amber-900 p-5 sm:p-7 text-white shadow-lg">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              <Sparkles className="size-3.5 text-amber-300" />
              <span>{t.tagline || "Right Market. Right Time. Better Income."}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
              {t.appName || "KisanSaathi"}
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-xl">
              {t.heroDescription || "Compare mandi prices, calculate transport costs, find the highest net earning market, and discover verified agricultural services."}
            </p>

            {/* Location & Crop Quick Badge */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-bold transition-colors backdrop-blur-xs"
              >
                <MapPin className="size-3.5 text-amber-300" />
                <span>
                  {s.loc
                    ? locationLabel(s.loc, t)
                    : t.setLocation || "Set Location"}
                </span>
              </button>

              <div className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur-xs">
                <Sprout className="size-3.5 text-amber-300" />
                <span>{selectedCrop.localizedNames[s.lang] ?? selectedCrop.name}</span>
              </div>

              <div className="ml-auto">
                <ListenButton
                  text={voiceSummaryText}
                  className="bg-white text-emerald-950 hover:bg-emerald-50 text-xs py-1.5"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Location Selector Popup Accordion */}
        {showLocationPicker && (
          <div className="relative">
            <LocationSelector
              value={s.loc}
              onChange={(newLoc) => {
                set({ loc: newLoc });
                setShowLocationPicker(false);
              }}
              onClose={() => setShowLocationPicker(false)}
            />
          </div>
        )}

        {/* Crop Selector Card */}
        <section className="rounded-2xl border bg-card p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sprout className="size-5 text-primary" />
              <h2 className="font-display text-base font-bold text-foreground">
                {t.chooseCrop || "Select Produce"}
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">{fmt(t.cropCount, { n: CROPS.length })}</span>
          </div>

          <CropPicker
            value={s.crop}
            onChange={(cropId) => set({ crop: cropId })}
            grid={false}
            showCategoryFilter={true}
          />
        </section>

        {/* Live Market Spread Highlight Card */}
        {marketHighlights.top && (
          <section className="rounded-2xl border bg-gradient-to-r from-emerald-50 to-amber-50/50 dark:from-emerald-950/20 dark:to-amber-950/10 p-4 sm:p-5 shadow-xs border-emerald-200/60 dark:border-emerald-800/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                  {t.topRecommendedMarket || "Top Recommended Market"}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">
                  {marketHighlights.top.market.names[s.lang] ??
                    marketHighlights.top.market.names.en}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {fmt(t.approxDistanceModalPrice, {
                    distance: marketHighlights.top.dist,
                    price: marketHighlights.top.price,
                  })}
                </p>
              </div>

              <div className="flex items-baseline gap-3 sm:text-right">
                <div>
                  <span className="block text-xs font-semibold text-muted-foreground">
                    {t.estimatedNetPerQuintal}
                  </span>
                  <span className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                    ₹{Math.round(marketHighlights.top.netPerQ)}
                  </span>
                </div>
                {marketHighlights.spread > 0 && (
                  <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/50 p-2 text-left">
                    <span className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
                      {t.extraVsNearest}
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                      +{rupees(marketHighlights.spread)}/10q
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-200/40 dark:border-emerald-800/30 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <TrendingUp className="size-3.5 text-emerald-600" />
                {t.updatedPriceFreight}
              </span>
              <Link
                to="/best-market"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>{t.compareAllMandis || "Compare all candidate mandis"}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </section>
        )}

        {/* 12-Module Quick Access Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">
              {t.coreToolsServices || "Core Agricultural Tools & Services"}
            </h2>
            <span className="text-xs text-muted-foreground">
              {t.allFeaturesFunctional || "All features functional"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 1. Mandi Prices */}
            <Link
              to="/mandi-prices"
              className="flex items-start gap-3.5 rounded-2xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm group"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 group-hover:scale-105 transition-transform">
                <Store className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                  {t.mandiPrices || "KisanMandi Prices"}
                </h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  {t.searchMinMaxModal}
                </p>
              </div>
            </Link>

            {/* 2. Best Market Finder */}
            <Link
              to="/best-market"
              className="flex items-start gap-3.5 rounded-2xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm group"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 group-hover:scale-105 transition-transform">
                <Compass className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                  {t.bestMarket || "Best Market Finder"}
                </h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  {t.rankNetProceedsDesc}
                </p>
              </div>
            </Link>

            {/* 3. When to Sell */}
            <Link
              to="/when-to-sell"
              className="flex items-start gap-3.5 rounded-2xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm group"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 group-hover:scale-105 transition-transform">
                <Hourglass className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                  {t.whenToSell || "When to Sell"}
                </h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  {t.priceTrajectoryDesc}
                </p>
              </div>
            </Link>

            {/* 4. Trends & Planning */}
            <Link
              to="/trends"
              className="flex items-start gap-3.5 rounded-2xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm group"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 group-hover:scale-105 transition-transform">
                <LineChart className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                  {t.trends || "Price Trends & Planning"}
                </h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  {t.priceHistoryDesc}
                </p>
              </div>
            </Link>

            {/* 5. Farming Profit Calculator */}
            <Link
              to="/calculator"
              className="flex items-start gap-3.5 rounded-2xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm group"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 group-hover:scale-105 transition-transform">
                <Calculator className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                  {t.calculator || "Farming Profit Calculator"}
                </h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  {t.cultivationCostDesc}
                </p>
              </div>
            </Link>

            {/* 6. Direct Buyer Marketplace */}
            <Link
              to="/buyers"
              className="flex items-start gap-3.5 rounded-2xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm group"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 group-hover:scale-105 transition-transform">
                <Handshake className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                  {t.buyers || "Direct Buyer Market"}
                </h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  {t.buyerConnectDesc}
                </p>
              </div>
            </Link>

            {/* 7. Organic Fertilizer & Manure */}
            <Link
              to="/fertilizer"
              className="flex items-start gap-3.5 rounded-2xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm group"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-lime-100 text-lime-800 dark:bg-lime-950/60 dark:text-lime-300 group-hover:scale-105 transition-transform">
                <Sprout className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                  {t.fertilizer || "Organic Fertilizer & Manure"}
                </h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  {t.fertilizerTradeDesc}
                </p>
              </div>
            </Link>

            {/* 8. Farmer Training & Workshops */}
            <Link
              to="/workshops"
              className="flex items-start gap-3.5 rounded-2xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm group"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 group-hover:scale-105 transition-transform">
                <GraduationCap className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                  {t.workshops || "Training & Workshops"}
                </h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  {t.workshopsDesc}
                </p>
              </div>
            </Link>

            {/* 9. Transport Coordination */}
            <Link
              to="/transport"
              className="flex items-start gap-3.5 rounded-2xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm group"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 group-hover:scale-105 transition-transform">
                <Truck className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                  {t.transport || "Transport Coordination"}
                </h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  {t.transportPoolingDesc}
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* Lantana Eco-Guard Featured Research Pilot Section */}
        <section className="rounded-3xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50 via-orange-50/40 to-yellow-50/60 dark:border-amber-700/60 dark:from-amber-950/30 dark:via-background dark:to-orange-950/20 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-200/80 dark:bg-amber-900/60 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                <ShieldAlert className="size-3.5" />
                <span>{t.researchPilotModule || "Research-Pilot Module · Evidence-Based"}</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">
                {t.lantanaTitle}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t.lantanaDescription}
              </p>
            </div>

            <div className="shrink-0">
              <Link
                to="/lantana-guard"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-xs hover:bg-amber-700 transition-colors"
              >
                <span>{t.exploreEcoGuard || "Explore Eco-Guard"}</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Page>
  );
}

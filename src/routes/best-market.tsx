import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  Compass,
  FileQuestion,
  HelpCircle,
  Info,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Receipt,
  Route as RouteIcon,
  ShieldAlert,
  Sparkles,
  Sprout,
  Store,
  Tag,
  TrendingUp,
  Truck,
  Volume2,
  X,
} from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { Page } from "@/components/AppShell";
import { CropArt } from "@/components/CropArt";
import { CropPicker } from "@/components/CropPicker";
import { ListenButton } from "@/components/ListenButton";
import {
  calculateNetProceeds,
  convertPrice,
  convertQuantity,
  rankMarketsByNetProceeds,
  rupees,
  type CandidateMarketRecord,
  type WeightUnit,
} from "@/lib/calc";
import { cropById, MARKETS, type CropId } from "@/lib/data";
import { fmt } from "@/lib/i18n";
import { useSettings } from "@/lib/store";

const MandiMap = lazy(() => import("@/components/MandiMap"));

export const Route = createFileRoute("/best-market")({
  head: () => ({
    meta: [
      { title: "Best Market Finder — Highest Net Proceeds | KisanSaathi" },
      {
        name: "description",
        content:
          "Rank APMC mandis by true net earnings after transport, statutory fees, loading, packaging and transit deductions.",
      },
    ],
  }),
  component: BestMarketFinderPage,
});

function BestMarketFinderPage() {
  const { s, set, t } = useSettings();
  const [unit, setUnit] = useState<WeightUnit>("quintal");
  const [quantity, setQuantity] = useState<number>(s.qty || 10);
  const [ratePerKm, setRatePerKm] = useState<number>(s.myVehicle ? s.vehicleRate : s.rate || 1.8);
  const [hasOwnVehicle, setHasOwnVehicle] = useState<boolean>(s.myVehicle || false);
  const [showAdvancedCosts, setShowAdvancedCosts] = useState<boolean>(false);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);

  // Advanced customizable cost overrides
  const [loadingPerQuintal, setLoadingPerQuintal] = useState<number>(15);
  const [packagingPerQuintal, setPackagingPerQuintal] = useState<number>(15);
  const [otherSellingCosts, setOtherSellingCosts] = useState<number>(0);
  const [manualQuotes, setManualQuotes] = useState<Record<string, number>>({});

  const crop = useMemo(() => cropById(s.crop), [s.crop]);
  const userLoc: [number, number] = useMemo(
    () => (s.loc ? [s.loc.lat, s.loc.lng] : [13.14, 78.13]),
    [s.loc],
  );

  // Execute Ranking Engine
  const rankedMarkets = useMemo(() => {
    if (quantity <= 0) return [];
    return rankMarketsByNetProceeds({
      crop,
      quantity,
      unit,
      originCoords: userLoc,
      ratePerKmPerQuintal: ratePerKm,
      manualTransportQuotes: manualQuotes,
      customCosts: {
        loadingUnloadingPerQuintal: loadingPerQuintal,
        packagingPerQuintal: packagingPerQuintal,
        otherExpenses: otherSellingCosts,
      },
    });
  }, [
    crop,
    quantity,
    unit,
    userLoc,
    ratePerKm,
    manualQuotes,
    loadingPerQuintal,
    packagingPerQuintal,
    otherSellingCosts,
  ]);

  const bestOption = rankedMarkets[0] ?? null;

  const voiceSummary = useMemo(() => {
    if (!bestOption) return t.empty;
    const mName = bestOption.market.names[s.lang] ?? bestOption.market.names.en;
    const net = Math.round(bestOption.breakdown.netProceeds);
    const extraMsg =
      bestOption.diffVsNearestNet && bestOption.diffVsNearestNet > 0
        ? ` That is ${bestOption.diffVsNearestNet} rupees more than your nearest market.`
        : "";
    return `KisanSaathi recommendation: Selling ${quantity} ${unit} of ${
      crop.localizedNames[s.lang] ?? crop.name
    } at ${mName} offers the highest estimated net proceeds of ${net} rupees.${extraMsg}`;
  }, [bestOption, quantity, unit, crop, s.lang, t.empty]);

  return (
    <Page>
      <div className="space-y-5">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="size-6 text-primary" />
              <h1 className="font-display text-2xl font-extrabold text-foreground">
                {t.bestMarket || "Best Market Finder"}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Net proceeds = (Price × Qty) − Transport − Mandi Fees − Loading − Packaging − Spoilage
            </p>
          </div>

          <ListenButton text={voiceSummary} className="self-start sm:self-auto text-xs py-1.5" />
        </div>

        {/* Inputs Section */}
        <section className="rounded-2xl border bg-card p-4 shadow-2xs space-y-4">
          {/* Crop Selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Select Crop
            </label>
            <CropPicker
              value={s.crop}
              onChange={(c) => {
                set({ crop: c });
                setSelectedMarketId(null);
              }}
              grid={false}
              showCategoryFilter={true}
            />
          </div>

          {/* Quantity & Unit Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Produce Quantity & Unit
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl border bg-background overflow-hidden flex-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex size-10 items-center justify-center hover:bg-muted text-foreground"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-4" />
                  </button>
                  <input
                    type="number"
                    min={0.1}
                    step={unit === "tonne" ? 0.1 : 1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0.1, Number(e.target.value) || 1))}
                    className="h-10 w-full text-center text-sm font-extrabold text-foreground focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex size-10 items-center justify-center hover:bg-muted text-foreground"
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>

                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as WeightUnit)}
                  className="h-10 rounded-xl border bg-background px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="quintal">Quintals (100 kg)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="tonne">Tonnes (1000 kg)</option>
                </select>
              </div>
            </div>

            {/* Freight Rate */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Transport Freight Rate (₹ / quintal / km)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={0.1}
                  min={0.1}
                  value={ratePerKm}
                  onChange={(e) => setRatePerKm(Math.max(0.1, Number(e.target.value) || 0.1))}
                  className="h-10 w-28 rounded-xl border bg-background px-3 text-center text-sm font-extrabold text-foreground focus:ring-2 focus:ring-primary"
                />
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasOwnVehicle}
                    onChange={(e) => {
                      setHasOwnVehicle(e.target.checked);
                      setRatePerKm(e.target.checked ? 1.2 : 1.8);
                    }}
                    className="size-4 rounded text-primary focus:ring-primary"
                  />
                  <span>Own vehicle (fuel rate ~₹1.2/q/km)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Collapsible Advanced Cost Components */}
          <div className="pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowAdvancedCosts(!showAdvancedCosts)}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              {showAdvancedCosts ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
              <span>
                {showAdvancedCosts
                  ? "Hide extra cost parameters"
                  : "Customize handling, packaging & manual transporter quotes"}
              </span>
            </button>

            {showAdvancedCosts && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-muted/40 p-3 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    Loading/Unloading (₹/quintal)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={loadingPerQuintal}
                    onChange={(e) => setLoadingPerQuintal(Number(e.target.value) || 0)}
                    className="h-9 w-full rounded-lg border bg-background px-2 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    Packaging / Crates (₹/quintal)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={packagingPerQuintal}
                    onChange={(e) => setPackagingPerQuintal(Number(e.target.value) || 0)}
                    className="h-9 w-full rounded-lg border bg-background px-2 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    Other Incidental Expenses (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={otherSellingCosts}
                    onChange={(e) => setOtherSellingCosts(Number(e.target.value) || 0)}
                    className="h-9 w-full rounded-lg border bg-background px-2 font-bold"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Best Choice Highlight Card */}
        {bestOption && (
          <section className="rounded-3xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-card p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider shadow-xs">
                  <BadgeCheck className="size-4" />
                  Highest Estimated Net Proceeds
                </span>
                <h2 className="font-display text-2xl font-extrabold text-foreground">
                  {bestOption.market.names[s.lang] ?? bestOption.market.names.en}
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3.5 text-primary" />
                  {bestOption.market.district}, {bestOption.market.state} · Approx.{" "}
                  {bestOption.approximateDistanceKm} km road distance
                </p>
              </div>

              <div className="text-left sm:text-right space-y-0.5">
                <span className="block text-xs font-bold text-muted-foreground">
                  Estimated Total Net Proceeds
                </span>
                <span className="font-display text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                  {rupees(bestOption.breakdown.netProceeds)}
                </span>
                <span className="block text-xs font-semibold text-muted-foreground">
                  (₹{Math.round(bestOption.breakdown.netProceedsPerUnit)} / {unit})
                </span>
              </div>
            </div>

            {bestOption.diffVsNearestNet !== null && bestOption.diffVsNearestNet > 0 && (
              <div className="rounded-xl bg-emerald-100 dark:bg-emerald-950/60 p-2.5 text-xs text-emerald-900 dark:text-emerald-200 font-bold flex items-center justify-between">
                <span>Advantage over nearest APMC yard:</span>
                <span className="text-sm">
                  +{rupees(bestOption.diffVsNearestNet)} extra in hand
                </span>
              </div>
            )}

            {/* Quick breakdown bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/80 text-xs">
              <div className="rounded-xl bg-card border p-2">
                <span className="block text-[10px] text-muted-foreground">Gross Revenue</span>
                <span className="font-bold text-foreground">
                  {rupees(bestOption.breakdown.grossRevenue)}
                </span>
              </div>
              <div className="rounded-xl bg-card border p-2">
                <span className="block text-[10px] text-muted-foreground">Transport Freight</span>
                <span className="font-bold text-destructive">
                  −{rupees(bestOption.breakdown.transportCost)}
                </span>
              </div>
              <div className="rounded-xl bg-card border p-2">
                <span className="block text-[10px] text-muted-foreground">Mandi statutory fee</span>
                <span className="font-bold text-destructive">
                  −{rupees(bestOption.breakdown.marketFees)}
                </span>
              </div>
              <div className="rounded-xl bg-card border p-2">
                <span className="block text-[10px] text-muted-foreground">Loading & Spoilage</span>
                <span className="font-bold text-destructive">
                  −
                  {rupees(
                    bestOption.breakdown.loadingUnloadingCharges +
                      bestOption.breakdown.packagingCosts +
                      bestOption.breakdown.otherSellingExpenses,
                  )}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* View Toggle (List vs Map) */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">
            Ranked Candidate Markets ({rankedMarkets.length})
          </h2>

          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted"
          >
            <Navigation className="size-3.5 text-primary" />
            <span>{showMap ? "Hide Interactive Map" : "Show Mandi Map"}</span>
          </button>
        </div>

        {/* Interactive Mandi Map */}
        {showMap && (
          <Suspense
            fallback={
              <div className="h-64 rounded-2xl border bg-muted flex items-center justify-center text-xs">
                Loading map...
              </div>
            }
          >
            <MandiMap />
          </Suspense>
        )}

        {/* Ranked Market List */}
        <div className="space-y-3">
          {rankedMarkets.map((item, idx) => {
            const isSelected = selectedMarketId === item.market.id;
            return (
              <div
                key={item.market.id}
                className={`rounded-2xl border bg-card p-4 shadow-2xs transition-all ${
                  item.isBest ? "border-emerald-500/80 bg-emerald-500/5" : "hover:border-primary/40"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                        item.isBest
                          ? "bg-emerald-600 text-white"
                          : idx === 1
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      #{idx + 1}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-foreground">
                          {item.market.names[s.lang] ?? item.market.names.en}
                        </h3>
                        {item.isBest && (
                          <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[10px] font-bold text-white uppercase">
                            Best
                          </span>
                        )}
                        {item.market.kind === "direct" && (
                          <span className="rounded bg-blue-100 dark:bg-blue-950/80 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">
                            Direct Buyer
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.market.district}, {item.market.state} · Approx.{" "}
                        {item.approximateDistanceKm} km road distance · Price: ₹
                        {item.expectedPricePerUnit}/{unit}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <span className="block text-[10px] text-muted-foreground font-semibold">
                        Estimated Net Proceeds
                      </span>
                      <span className="font-display text-lg sm:text-xl font-extrabold text-foreground">
                        {rupees(item.breakdown.netProceeds)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedMarketId(isSelected ? null : item.market.id)}
                      className="rounded-xl border bg-muted/30 p-2 text-foreground hover:bg-muted"
                      aria-label="Toggle cost breakdown"
                    >
                      {isSelected ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Detailed Cost Itemization */}
                {isSelected && (
                  <div className="mt-4 pt-3 border-t space-y-2 text-xs">
                    <h4 className="font-bold text-foreground flex items-center gap-1.5">
                      <Receipt className="size-3.5 text-primary" />
                      Detailed Cost & Net Calculation Breakdown
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Gross Sales Value:
                        </span>
                        <span className="font-bold text-foreground">
                          {quantity} {unit} × ₹{item.expectedPricePerUnit} ={" "}
                          {rupees(item.breakdown.grossRevenue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Transport Freight:
                        </span>
                        <span className="font-bold text-destructive">
                          −{rupees(item.breakdown.transportCost)} ({item.approximateDistanceKm} km @
                          ₹{ratePerKm}/q/km)
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Mandi Market Fee:
                        </span>
                        <span className="font-bold text-destructive">
                          −{rupees(item.breakdown.marketFees)} ({item.market.feePct}% statutory)
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Loading & Handling:
                        </span>
                        <span className="font-bold text-destructive">
                          −{rupees(item.breakdown.loadingUnloadingCharges)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Packaging Costs:
                        </span>
                        <span className="font-bold text-destructive">
                          −{rupees(item.breakdown.packagingCosts)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Transit Spoilage / Other:
                        </span>
                        <span className="font-bold text-destructive">
                          −{rupees(item.breakdown.otherSellingExpenses)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-2.5 font-bold text-emerald-900 dark:text-emerald-200">
                      <span>Total Costs: {rupees(item.breakdown.totalCosts)}</span>
                      <span>Net In-Hand: {rupees(item.breakdown.netProceeds)}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <label className="text-[11px] text-muted-foreground">
                        Have a specific transport quotation for this mandi?
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 1500"
                        value={manualQuotes[item.market.id] ?? ""}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val > 0) {
                            setManualQuotes({ ...manualQuotes, [item.market.id]: val });
                          } else {
                            const copy = { ...manualQuotes };
                            delete copy[item.market.id];
                            setManualQuotes(copy);
                          }
                        }}
                        className="h-8 w-24 rounded-lg border bg-background px-2 text-xs font-bold"
                      />
                      <span className="text-[11px] text-muted-foreground">₹ quote</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Methodology & Cautious Disclaimer */}
        <section className="rounded-2xl border border-border/80 bg-muted/20 p-4 text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <ShieldAlert className="size-4 text-primary" />
            <span>Important Decision Guidance Notice</span>
          </div>
          <p className="leading-relaxed">
            Distances shown are approximate road travel estimations. APMC statutory market fees and
            freight quotes reflect standard benchmarks. Final realized prices, quality grading,
            moisture deductions and actual transporter quotes at the market yard may differ.
          </p>
        </section>
      </div>
    </Page>
  );
}

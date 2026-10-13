import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  Compass,
  Database,
  HelpCircle,
  Info,
  Layers,
  LineChart as LineChartIcon,
  MapPin,
  Scale,
  ShieldAlert,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Page } from "@/components/AppShell";
import { CropArt } from "@/components/CropArt";
import { CropPicker } from "@/components/CropPicker";
import { rupees } from "@/lib/calc";
import { CROPS, cropById, MARKETS, priceSeries, type CropId } from "@/lib/data";
import { fmt } from "@/lib/i18n";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Price Trends & Crop Planning | KisanSaathi" },
      {
        name: "description",
        content:
          "Interactive 60-day APMC mandi modal price curves, market comparisons and cautious seasonal crop planning worksheet.",
      },
    ],
  }),
  component: PriceTrendsPage,
});

function PriceTrendsPage() {
  const { s, set, t } = useSettings();
  const [cropId, setCropId] = useState<CropId>(s.crop);
  const [daysRange, setDaysRange] = useState<15 | 30 | 60>(30);
  const [primaryMarketId, setPrimaryMarketId] = useState<string>("klr");
  const [comparisonMarketId, setComparisonMarketId] = useState<string>("ypr");

  // Crop Planning Worksheet state
  const [planAreaAcres, setPlanAreaAcres] = useState<number>(2);
  const [planYieldQ, setPlanYieldQ] = useState<number>(100);
  const [planCostPerAcre, setPlanCostPerAcre] = useState<number>(70000);
  const [waterAvailability, setWaterAvailability] = useState<"adequate" | "moderate" | "scarce">(
    "adequate",
  );

  const crop = useMemo(() => cropById(cropId), [cropId]);
  const primaryMarket = useMemo(
    () => MARKETS.find((m) => m.id === primaryMarketId) ?? MARKETS[0],
    [primaryMarketId],
  );
  const compMarket = useMemo(
    () => MARKETS.find((m) => m.id === comparisonMarketId) ?? MARKETS[1],
    [comparisonMarketId],
  );

  // Sync planning defaults when crop changes
  const handleCropChange = (c: CropId) => {
    setCropId(c);
    const selected = cropById(c);
    setPlanYieldQ(selected.yieldQ);
    setPlanCostPerAcre(selected.inputCost);
  };

  // Build chart dataset with dates
  const chartData = useMemo(() => {
    const s1 = priceSeries(crop, primaryMarket, daysRange);
    const s2 = priceSeries(crop, compMarket, daysRange);

    const now = new Date();
    return s1.map((val1, index) => {
      const daysAgo = daysRange - 1 - index;
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      const locale = { en: "en-IN", kn: "kn-IN", hi: "hi-IN", ta: "ta-IN", te: "te-IN", mr: "mr-IN" }[s.lang];
      const dateLabel = d.toLocaleDateString(locale, { month: "short", day: "numeric" });

      return {
        date: dateLabel,
        [primaryMarket.names.en]: val1,
        [compMarket.names.en]: s2[index] ?? val1,
      };
    });
  }, [crop, primaryMarket, compMarket, daysRange, s.lang]);

  // Worksheet calculations
  const totalProductionCost = planAreaAcres * planCostPerAcre;
  const totalYieldQuintals = planAreaAcres * planYieldQ;
  const averageModalPrice = crop.basePrice;
  const estimatedRevenue = totalYieldQuintals * averageModalPrice;
  const estimatedNetReturn = estimatedRevenue - totalProductionCost;

  return (
    <Page>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <LineChartIcon className="size-6 text-primary" />
              <h1 className="font-display text-2xl font-extrabold text-foreground">
                {t.trends || "Historical Price Trends & Crop Planning"}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.trendIntro}
            </p>
          </div>

          {/* Time range selector */}
          <div className="flex rounded-xl border bg-card p-0.5 text-xs font-bold">
            {([15, 30, 60] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDaysRange(r)}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  daysRange === r
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r} {t.daysUnit}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              {t.chooseCrop}
            </label>
            <CropPicker
              value={cropId}
              onChange={handleCropChange}
              grid={false}
              showCategoryFilter={true}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {t.primaryMarketLine}
              </label>
              <select
                value={primaryMarketId}
                onChange={(e) => setPrimaryMarketId(e.target.value)}
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
                {t.comparisonMarketLine}
              </label>
              <select
                value={comparisonMarketId}
                onChange={(e) => setComparisonMarketId(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary"
              >
                {MARKETS.filter((m) => m.kind === "mandi").map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.names[s.lang] ?? m.names.en} ({m.district}, {m.state})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Price History Chart */}
        <section className="rounded-3xl border bg-card p-4 sm:p-6 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-extrabold text-foreground">
                {t.modalPriceTrends}
              </h2>
              <p className="text-xs text-muted-foreground">
                {fmt(t.observedPriceHistory, { n: daysRange })}
              </p>
            </div>
            <span className="rounded-md bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase self-start">
              {t.simulatedDemoSeries}
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number | string | undefined) => [`₹${val}/q`, ""]}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Line
                  type="monotone"
                  dataKey={primaryMarket.names.en}
                  name={primaryMarket.names[s.lang] ?? primaryMarket.names.en}
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey={compMarket.names.en}
                  name={compMarket.names[s.lang] ?? compMarket.names.en}
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Cautious Crop Planning Section */}
        <section className="rounded-3xl border bg-card p-5 shadow-sm space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sprout className="size-5 text-primary" />
              <h2 className="font-display text-xl font-extrabold text-foreground">
                {t.cropPlanningWorksheet}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.cautiousPlanningBody}
            </p>
          </div>

          {/* Worksheet Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-2xl bg-muted/30 p-3.5 text-xs">
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                {t.plannedAreaAcres}
              </label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={planAreaAcres}
                onChange={(e) => setPlanAreaAcres(Math.max(0.5, Number(e.target.value) || 1))}
                className="h-9 w-full rounded-lg border bg-background px-2.5 font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                {t.anticipatedYieldAcre}
              </label>
              <input
                type="number"
                min={1}
                value={planYieldQ}
                onChange={(e) => setPlanYieldQ(Math.max(1, Number(e.target.value) || 1))}
                className="h-9 w-full rounded-lg border bg-background px-2.5 font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                {t.estimatedCultivationCostAcre}
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={planCostPerAcre}
                onChange={(e) => setPlanCostPerAcre(Math.max(0, Number(e.target.value) || 0))}
                className="h-9 w-full rounded-lg border bg-background px-2.5 font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                {t.irrigationWaterAvailability}
              </label>
              <select
                value={waterAvailability}
                onChange={(e) =>
                  setWaterAvailability(e.target.value as "adequate" | "moderate" | "scarce")
                }
                className="h-9 w-full rounded-lg border bg-background px-2 text-xs font-semibold"
              >
                <option value="adequate">{t.waterAdequate}</option>
                <option value="moderate">{t.waterModerate}</option>
                <option value="scarce">{t.waterScarce}</option>
              </select>
            </div>
          </div>

          {/* Projected Estimates Output */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
            <div className="rounded-xl border bg-card p-3">
              <span className="block text-[11px] text-muted-foreground">{t.totalExpectedYield}</span>
              <span className="text-base font-extrabold text-foreground">
                {totalYieldQuintals} {t.quintal}
              </span>
            </div>

            <div className="rounded-xl border bg-card p-3">
              <span className="block text-[11px] text-muted-foreground">{t.totalProductionCost}</span>
              <span className="text-base font-extrabold text-destructive">
                {rupees(totalProductionCost)}
              </span>
            </div>

            <div className="rounded-xl border bg-card p-3">
              <span className="block text-[11px] text-muted-foreground">{t.estimatedGrossRevenue}</span>
              <span className="text-base font-extrabold text-foreground">
                {rupees(estimatedRevenue)}
              </span>
            </div>

            <div
              className={`rounded-xl border p-3 ${estimatedNetReturn >= 0 ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200" : "bg-destructive/10 text-destructive"}`}
            >
              <span className="block text-[11px]">{t.estimatedReturnOverCost}</span>
              <span className="text-base font-extrabold">
                {estimatedNetReturn >= 0
                  ? `+${rupees(estimatedNetReturn)}`
                  : rupees(estimatedNetReturn)}
              </span>
            </div>
          </div>

          {/* Critical Disclaimer (Per Section 10 of Prompt) */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <ShieldAlert className="size-4 text-primary" />
              <span>{t.cautiousPlanningTitle}</span>
            </div>
            <p className="leading-relaxed">
              {t.cautiousPlanningBody}
            </p>
          </div>
        </section>
      </div>
    </Page>
  );
}

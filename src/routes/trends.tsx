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
import { useEffect, useMemo, useState } from "react";
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
import {
  buildHistoricalPriceSeries,
  cropById,
  MARKETS,
  type CropId,
  type MandiPriceRecord,
} from "@/lib/data";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Price Trends & Crop Planning | KisanSaathi" },
      {
        name: "description",
        content:
          "Compare actual one-year APMC mandi price observations, recent seven-day records, latest arrivals and market prices.",
      },
    ],
  }),
  component: PriceTrendsPage,
});

interface HistoryPoint {
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

interface PriceHistoryPayload {
  records?: MandiPriceRecord[];
  source?: "live" | "demo" | "empty";
  actualRetrievalTime?: string;
  latestObservationDate?: string | null;
  historyWindow?: {
    startDate: string;
    endDate: string;
    recentStartDate: string;
    recentEndDate: string;
  };
  historicalSeries?: HistoryPoint[];
  recentSevenDayHistory?: HistoryPoint[];
}

function PriceTrendsPage() {
  const { s, t } = useSettings();
  const [cropId, setCropId] = useState<CropId>(s.crop);
  const [primaryMarketId, setPrimaryMarketId] = useState<string>("klr");
  const [comparisonMarketId, setComparisonMarketId] = useState<string>("ypr");
  const [primaryPrices, setPrimaryPrices] = useState<PriceHistoryPayload | null>(null);
  const [comparisonPrices, setComparisonPrices] = useState<PriceHistoryPayload | null>(null);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [priceLoadError, setPriceLoadError] = useState(false);

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

  useEffect(() => {
    const controller = new AbortController();
    const loadMarket = async (marketId: string) => {
      const market = MARKETS.find((item) => item.id === marketId);
      if (!market) throw new Error("Selected market is unavailable");
      const params = new URLSearchParams({
        crop: cropId,
        state: market.state,
        marketId,
      });
      const headers = s.dataGovApiKey
        ? { "x-data-gov-key": s.dataGovApiKey }
        : undefined;
      const response = await fetch(`/api/mandi-prices?${params}`, {
        headers,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Mandi price request failed: ${response.status}`);
      return (await response.json()) as PriceHistoryPayload;
    };

    setIsLoadingPrices(true);
    setPriceLoadError(false);
    Promise.all([loadMarket(primaryMarketId), loadMarket(comparisonMarketId)])
      .then(([primary, comparison]) => {
        setPrimaryPrices(primary);
        setComparisonPrices(comparison);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Unable to load historical mandi prices", error);
        setPriceLoadError(true);
        setPrimaryPrices(null);
        setComparisonPrices(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingPrices(false);
      });

    return () => controller.abort();
  }, [cropId, primaryMarketId, comparisonMarketId, s.dataGovApiKey]);

  const primaryHasActualHistory =
    primaryPrices?.source === "live" && Boolean(primaryPrices.historicalSeries?.length);
  const comparisonHasActualHistory =
    comparisonPrices?.source === "live" && Boolean(comparisonPrices.historicalSeries?.length);
  const sourceIsLive = primaryHasActualHistory || comparisonHasActualHistory;
  const allSourcesAreLive = primaryHasActualHistory && comparisonHasActualHistory;
  const historyWindow = primaryPrices?.historyWindow ?? comparisonPrices?.historyWindow;
  const actualRetrievalTime = primaryPrices?.actualRetrievalTime ?? comparisonPrices?.actualRetrievalTime;
  const latestObservationDate = [
    primaryPrices?.latestObservationDate,
    comparisonPrices?.latestObservationDate,
  ].filter((date): date is string => Boolean(date)).sort().at(-1);
  const formatDate = (date?: string | null) => {
    if (!date) return "—";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleDateString(
          { en: "en-IN", kn: "kn-IN", hi: "hi-IN", ta: "ta-IN", te: "te-IN", mr: "mr-IN" }[s.lang],
          { day: "2-digit", month: "short", year: "numeric" },
        );
  };
  const formatTimestamp = (date?: string) => {
    if (!date) return "—";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString("en-IN");
  };

  const primarySeriesKey = `${primaryMarket.names.en}${primaryHasActualHistory ? "" : " (DEMO)"}`;
  const comparisonSeriesKey = `${compMarket.names.en}${comparisonHasActualHistory ? "" : " (DEMO)"}`;

  // Show an illustrative series when actual observations are unavailable; it is labeled as demo.
  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, string | number>>();
    const primarySeries =
      primaryHasActualHistory
        ? primaryPrices.historicalSeries ?? []
        : buildHistoricalPriceSeries(crop, primaryMarket);
    const comparisonSeries =
      comparisonHasActualHistory
        ? comparisonPrices.historicalSeries ?? []
        : buildHistoricalPriceSeries(crop, compMarket);
    for (const [series, key] of [
      [primarySeries, primarySeriesKey],
      [comparisonSeries, comparisonSeriesKey],
    ] as const) {
      for (const point of series) {
        const row = byDate.get(point.date) ?? { date: point.date };
        row[key] = point.modalPrice;
        byDate.set(point.date, row);
      }
    }
    return [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [
    primaryPrices,
    comparisonPrices,
    primaryMarket,
    compMarket,
    crop,
    primaryHasActualHistory,
    comparisonHasActualHistory,
    primarySeriesKey,
    comparisonSeriesKey,
  ]);

  const recentHistory = useMemo(() => {
    const byDate = new Map<string, Record<string, string | number>>();
    for (const [series, key] of [
      [primaryPrices?.recentSevenDayHistory ?? [], primaryMarket.names.en],
      [comparisonPrices?.recentSevenDayHistory ?? [], compMarket.names.en],
    ] as const) {
      for (const point of series) {
        const row = byDate.get(point.date) ?? { date: point.date };
        row[key] = point.modalPrice;
        byDate.set(point.date, row);
      }
    }
    return [...byDate.values()].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [primaryPrices, comparisonPrices, primaryMarket, compMarket]);

  const latestPrimary = primaryPrices?.source === "live" ? primaryPrices.records?.[0] : undefined;
  const latestComparison = comparisonPrices?.source === "live" ? comparisonPrices.records?.[0] : undefined;

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

          <span className="rounded-xl border bg-card px-3 py-2 text-xs font-bold text-foreground">
            {t.historyWindowLabel}
          </span>
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

        <section className="rounded-2xl border bg-card p-4 text-xs shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-foreground">{t.priceFreshnessTitle}</h2>
            <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${sourceIsLive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"}`}>
              {allSourcesAreLive
                ? t.liveDataBadge
                : sourceIsLive
                  ? t.mixedLiveDemoData
                  : t.simulatedDemoSeries}
            </span>
          </div>
          <p className="text-muted-foreground">
            {t.historicalDateRange}: {formatDate(historyWindow?.startDate)} – {formatDate(historyWindow?.endDate)} · {t.recentSevenDaysLabel}: {formatDate(historyWindow?.recentStartDate)} – {formatDate(historyWindow?.recentEndDate)}
          </p>
          <p className="text-muted-foreground">
            {t.latestObservation}: {formatDate(latestObservationDate)} · {t.retrievedAt}: {formatTimestamp(actualRetrievalTime)}
          </p>
          {priceLoadError && <p role="alert" className="text-destructive">{t.priceHistoryLoadFailed}</p>}
          {!allSourcesAreLive && !priceLoadError && (
            <p className="text-amber-800 dark:text-amber-200">{t.realHistoricalPricesRequireKey}</p>
          )}
          {isLoadingPrices && <p className="text-muted-foreground">{t.checking}</p>}
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[{ market: primaryMarket, record: latestPrimary }, { market: compMarket, record: latestComparison }].map(({ market, record }) => (
            <div key={market.id} className="rounded-2xl border bg-card p-4 text-xs shadow-2xs">
              <p className="font-bold text-foreground">{market.names[s.lang] ?? market.names.en}</p>
              <p className="mt-1 text-muted-foreground">{t.latestAvailablePrice}: {record ? `₹${record.modalPrice} / quintal` : "—"}</p>
              <p className="text-muted-foreground">{t.observationDate}: {formatDate(record?.arrivalDate)}</p>
            </div>
          ))}
        </section>

        {/* Price History Chart */}
        <section className="rounded-3xl border bg-card p-4 sm:p-6 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-extrabold text-foreground">
                {t.modalPriceTrends}
              </h2>
              <p className="text-xs text-muted-foreground">
                {historyWindow
                  ? `${formatDate(historyWindow.startDate)} – ${formatDate(historyWindow.endDate)}`
                  : t.historyWindowLabel}
              </p>
            </div>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase self-start ${allSourcesAreLive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}>
              {allSourcesAreLive
                ? t.liveDataBadge
                : sourceIsLive
                  ? t.mixedLiveDemoData
                  : t.simulatedDemoSeries}
            </span>
          </div>

          {chartData.length > 0 ? (
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatDate} minTickGap={40} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(value) => formatDate(String(value))}
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
                  <Line type="monotone" dataKey={primarySeriesKey} name={`${primaryMarket.names[s.lang] ?? primaryMarket.names.en}${primaryHasActualHistory ? "" : ` (${t.simulatedDemoSeries})`}`} stroke="#16a34a" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} connectNulls={false} />
                  <Line type="monotone" dataKey={comparisonSeriesKey} name={`${compMarket.names[s.lang] ?? compMarket.names.en}${comparisonHasActualHistory ? "" : ` (${t.simulatedDemoSeries})`}`} stroke="#d97706" strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={{ r: 5 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">
              {isLoadingPrices ? t.checking : t.noHistoricalRecords}
            </p>
          )}
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-2xs">
          <h2 className="mb-3 font-bold text-foreground">{t.recentSevenDayHistoryTitle}</h2>
          {recentHistory.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b text-muted-foreground">
                  <tr><th className="py-2 pr-3">{t.observationDate}</th><th className="py-2 pr-3">{primaryMarket.names[s.lang] ?? primaryMarket.names.en}</th><th className="py-2">{compMarket.names[s.lang] ?? compMarket.names.en}</th></tr>
                </thead>
                <tbody>
                  {recentHistory.map((row) => (
                    <tr key={String(row.date)} className="border-b last:border-0">
                      <td className="py-2 pr-3">{formatDate(String(row.date))}</td>
                      <td className="py-2 pr-3">{row[primaryMarket.names.en] ? `₹${row[primaryMarket.names.en]}/q` : "—"}</td>
                      <td className="py-2">{row[compMarket.names.en] ? `₹${row[compMarket.names.en]}/q` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t.noRecentRecords}</p>
          )}
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

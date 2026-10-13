import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Filter,
  Info,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sprout,
  Store,
  Table as TableIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Page } from "@/components/AppShell";
import { CropArt } from "@/components/CropArt";
import { CropPicker } from "@/components/CropPicker";
import {
  CROPS,
  cropById,
  getMandiPriceRecords,
  MARKETS,
  STATES,
  type CropId,
  type MandiPriceRecord,
} from "@/lib/data";
import { fmt } from "@/lib/i18n";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/mandi-prices")({
  head: () => ({
    meta: [
      { title: "KisanMandi — APMC Mandi Prices | KisanSaathi" },
      {
        name: "description",
        content:
          "Browse modal, minimum and maximum commodity prices across APMC mandis in Karnataka, Tamil Nadu, Maharashtra, Andhra Pradesh and Telangana.",
      },
    ],
  }),
  component: MandiPricesPage,
});

function MandiPricesPage() {
  const { s, set, t } = useSettings();
  const [selectedCrop, setSelectedCrop] = useState<CropId>(s.crop);
  const [selectedState, setSelectedState] = useState<string>(s.loc?.state || "All");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [liveRecords, setLiveRecords] = useState<MandiPriceRecord[] | null>(null);
  const [priceWindow, setPriceWindow] = useState<{
    startDate?: string;
    endDate?: string;
    recentStartDate?: string;
    recentEndDate?: string;
    latestObservationDate?: string | null;
    actualRetrievalTime?: string;
    retrievalTimestamp?: string;
  } | null>(null);
  const [dataStatus, setDataStatus] = useState<
    "missing-key" | "error" | "key-rejected" | "empty" | "live"
  >("missing-key");
  const dataNotice = dataStatus === "live"
    ? t.liveDataReady
    : dataStatus === "missing-key"
      ? t.demoFallbackMissingKey
      : dataStatus === "empty"
        ? t.liveNoRecords
        : dataStatus === "key-rejected"
          ? t.apiKeyNotVerified
          : t.demoFallbackError;

  const loadPrices = useCallback(async (signal?: AbortSignal) => {
    setIsRefreshing(true);
    setLiveRecords(null);
    try {
      const params = new URLSearchParams({ crop: selectedCrop });
      if (selectedState !== "All") params.set("state", selectedState);
      const headers = s.dataGovApiKey
        ? { "x-data-gov-key": s.dataGovApiKey }
        : undefined;
      const response = await fetch(`/api/mandi-prices?${params}`, { signal, headers });
      const payload = (await response.json()) as {
        records?: MandiPriceRecord[];
        source?: "live" | "demo" | "empty";
        error?: string;
        upstreamStatus?: "ok" | "key-rejected" | "error";
        historyWindow?: {
          startDate?: string;
          endDate?: string;
          recentStartDate?: string;
          recentEndDate?: string;
          latestObservationDate?: string;
          retrievalTimestamp?: string;
        };
        latestObservationDate?: string;
      };
      if (!response.ok) {
        setDataStatus(payload.error === "api_key_missing" ? "missing-key" : "error");
        return false;
      }
      setPriceWindow({
        ...payload.historyWindow,
        latestObservationDate: payload.latestObservationDate ?? undefined,
        retrievalTimestamp: payload.actualRetrievalTime,
      });
      if (!payload.records?.length) {
        setLiveRecords([]);
        setDataStatus("empty");
        return false;
      }
      setLiveRecords(payload.records);
      if (payload.source === "demo") {
        setDataStatus(
          payload.upstreamStatus === "key-rejected"
            ? "key-rejected"
            : s.dataGovApiKey
              ? "error"
              : "missing-key",
        );
        return false;
      }
      setDataStatus("live");
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return false;
      setDataStatus("error");
      return false;
    } finally {
      if (!signal?.aborted) setIsRefreshing(false);
    }
  }, [selectedCrop, selectedState, s.dataGovApiKey]);

  useEffect(() => {
    const controller = new AbortController();
    void loadPrices(controller.signal);
    return () => controller.abort();
  }, [loadPrices]);

  // Available districts for chosen state
  const availableDistricts = useMemo(() => {
    if (selectedState === "All") return [];
    return Object.keys(STATES[selectedState] ?? {});
  }, [selectedState]);

  // Load records
  const demoRecords = useMemo(() => {
    return getMandiPriceRecords(selectedCrop, selectedState === "All" ? undefined : selectedState);
  }, [selectedCrop, selectedState]);
  const allRecords = liveRecords?.length ? liveRecords : demoRecords;

  // Filter records
  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      const matchDistrict =
        selectedDistrict === "All" || rec.district.toLowerCase() === selectedDistrict.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        rec.marketName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.state.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDistrict && matchSearch;
    });
  }, [allRecords, selectedDistrict, searchQuery]);

  const handleRefresh = async () => {
    const loadedLiveData = await loadPrices();
    if (loadedLiveData) {
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 3000);
    }
  };

  const crop = cropById(selectedCrop);
  const formatDate = (value?: string) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };
  const formatTimestamp = (value?: string) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };
  const priceWindowText = priceWindow
    ? `${formatDate(priceWindow.startDate)} to ${formatDate(priceWindow.endDate)} • Latest: ${formatDate(priceWindow.latestObservationDate)} • Retrieved: ${formatTimestamp(priceWindow.retrievalTimestamp)}`
    : "Date range unavailable";

  return (
    <Page>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Store className="size-6 text-primary" />
              <h1 className="font-display text-2xl font-extrabold text-foreground">
                {t.mandiPrices || "KisanMandi — Mandi Prices"}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.apmcDailyRates}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`size-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
              />
              <span>{isRefreshing ? t.checking : t.refresh}</span>
            </button>

            <div className="flex rounded-xl border bg-card p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`rounded-lg px-2.5 py-1.5 font-bold transition-colors ${
                  viewMode === "cards"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.cardsView}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-lg px-2.5 py-1.5 font-bold transition-colors ${
                  viewMode === "table"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.tableView}
              </button>
            </div>
          </div>
        </div>

        {/* Real Data Integration Architecture & DEMO Notice */}
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800/50 p-3.5 text-xs text-amber-950 dark:text-amber-200 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <Database className="size-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span className="flex items-center gap-2">
              {t.dataTransparency}
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  dataStatus === "live"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                }`}
              >
                {dataStatus === "live" ? t.liveDataBadge : t.demoDataBadge}
              </span>
            </span>
          </div>
          <p className="leading-relaxed">
            {dataNotice} {t.dataIntegrationNote}
          </p>
        </div>

        {refreshSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-100 p-2.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{t.cacheResynced}</span>
          </div>
        )}

        <div className="rounded-2xl border bg-card p-3.5 text-xs text-foreground shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-primary">
            <Calendar className="size-4" />
            <span>Historical price intelligence</span>
          </div>
          <div className="mt-2 space-y-1 text-muted-foreground">
            <p>Range: {priceWindowText}</p>
            <p>
              Base window: {formatDate(priceWindow?.startDate)} through {formatDate(priceWindow?.endDate)} · Recent 7-day window: {formatDate(priceWindow?.recentStartDate)} through {formatDate(priceWindow?.recentEndDate)}
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="size-3.5 text-primary" />
              {t.filterMarketsProduce}
            </span>
          </div>

          {/* Crop Selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              {t.chooseCrop}
            </label>
            <CropPicker
              value={selectedCrop}
              onChange={(c) => setSelectedCrop(c)}
              grid={false}
              showCategoryFilter={true}
            />
          </div>

          {/* Region Filters & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {t.state}
              </label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict("All");
                }}
                className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary"
              >
                <option value="All">{t.allSupportedStates}</option>
                {Object.keys(STATES).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {t.district}
              </label>
              <select
                value={selectedDistrict}
                disabled={selectedState === "All"}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="All">{t.allDistricts}</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {t.mandiSearch}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t.mandiSearchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-xl border bg-background pl-8 pr-3 text-xs focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Selected Crop Summary Card */}
        <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-3">
          <CropArt id={crop.id} size={48} />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-foreground truncate">
              {crop.localizedNames[s.lang] ?? crop.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t.referenceModalPrice}: ₹{crop.basePrice}/q · {t.perishability}:{" "}
              <span className="capitalize">{crop.perishability}</span>
            </p>
          </div>
          <span className="text-xs font-bold text-muted-foreground">
            {fmt(t.recordsFound, { n: filteredRecords.length })}
          </span>
        </div>

        {/* Results: Cards View */}
        {viewMode === "cards" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className="rounded-2xl border bg-card p-4 shadow-2xs space-y-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-foreground leading-tight">
                      {MARKETS.find((market) => market.id === rec.marketId)?.names[s.lang] ??
                        rec.marketName}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="size-3 text-primary" />
                      {rec.district}, {rec.state}
                    </p>
                  </div>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${rec.isDemo ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"}`}>
                    {rec.isDemo ? t.demoDataBadge : t.liveDataBadge}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/40 p-2.5 text-center">
                  <div>
                    <span className="block text-[10px] text-muted-foreground">{t.minPrice}</span>
                    <span className="text-xs font-bold text-foreground">₹{rec.minPrice}</span>
                  </div>
                  <div className="border-x border-border">
                    <span className="block text-[10px] font-bold text-primary">{t.modalPrice}</span>
                    <span className="text-sm font-extrabold text-primary">₹{rec.modalPrice}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground">{t.maxPrice}</span>
                    <span className="text-xs font-bold text-foreground">₹{rec.maxPrice}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {rec.isDemo ? t.simulatedDemoSeries : rec.retrievalTimestamp}
                  </span>
                  <span>{rec.priceUnit}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results: Table View */}
        {viewMode === "table" && (
          <div className="rounded-2xl border bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 text-muted-foreground font-bold border-b">
                  <tr>
                    <th className="py-2.5 px-3">{t.mandiPrices}</th>
                    <th className="py-2.5 px-3">{t.districtState}</th>
                    <th className="py-2.5 px-3">{t.dateLabel}</th>
                    <th className="py-2.5 px-3 text-right">{t.minUnitPrice}</th>
                    <th className="py-2.5 px-3 text-right">{t.modalUnitPrice}</th>
                    <th className="py-2.5 px-3 text-right">{t.maxUnitPrice}</th>
                    <th className="py-2.5 px-3">{t.sourceStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-foreground">
                        {MARKETS.find((market) => market.id === rec.marketId)?.names[s.lang] ??
                          rec.marketName}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {rec.district}, {rec.state}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {rec.isDemo ? t.simulatedDemoSeries : rec.arrivalDate}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        ₹{rec.minPrice}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-primary">
                        ₹{rec.modalPrice}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        ₹{rec.maxPrice}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                          {rec.isDemo ? t.demoDataBadge : t.liveDataBadge}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredRecords.length === 0 && (
          <div className="rounded-2xl border bg-card p-8 text-center space-y-2">
            <AlertCircle className="size-8 text-muted-foreground mx-auto" />
            <h3 className="font-bold text-foreground text-sm">{t.noMandiRecords}</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {t.noPricesMatchFilters}
            </p>
          </div>
        )}
      </div>
    </Page>
  );
}

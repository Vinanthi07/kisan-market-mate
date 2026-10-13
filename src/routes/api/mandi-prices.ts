import { createFileRoute } from "@tanstack/react-router";
import {
  CROPS,
  getMandiPriceRecords,
  getPriceHistoryWindow,
  MARKETS,
  type CropId,
} from "@/lib/data";

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const API_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

interface DataGovRecord {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  grade?: string;
  arrival_date?: string;
  min_price?: string | number;
  max_price?: string | number;
  modal_price?: string | number;
}

interface DataGovResponse {
  records?: DataGovRecord[];
  message?: string;
}

interface UpstreamDiagnostic {
  commodity: string;
  recordCount: number;
  parsedRecordCount: number;
  rejected: {
    invalidDate: number;
    invalidPrice: number;
    outsideDateWindow: number;
  };
}

function normalizeMarket(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(apmc|market)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeArrivalDate(value: string | undefined): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const dayFirst = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!dayFirst) return null;
  return `${dayFirst[3]}-${dayFirst[2].padStart(2, "0")}-${dayFirst[1].padStart(2, "0")}`;
}

const CROP_COMMODITY: Record<CropId, string[]> = {
  paddy: ["Rice", "Paddy"],
  ragi: ["Ragi"],
  jowar: ["Jowar", "Sorghum"],
  maize: ["Maize", "Corn"],
  wheat: ["Wheat"],
  tur_dal: ["Arhar (Tur/Red Gram)", "Tur", "Arhar"],
  green_gram: ["Moong (Green Gram)", "Green Gram", "Moong"],
  black_gram: ["Urd Beans (Black Gram)", "Black Gram", "Urad"],
  chickpea: ["Bengal Gram (Gram)", "Chickpea", "Bengal Gram"],
  groundnut: ["Groundnut"],
  sunflower: ["Sunflower"],
  sesame: ["Sesamum (Sesame, Gingelly, Til)", "Sesame", "Til"],
  soybean: ["Soyabean", "Soybean"],
  tomato: ["Tomato"],
  onion: ["Onion"],
  potato: ["Potato"],
  chilli: ["Green Chilli", "Chilli"],
  brinjal: ["Brinjal"],
  okra: ["Bhindi (Ladies Finger)", "Okra", "Bhindi"],
  banana: ["Banana"],
  mango: ["Mango"],
  grapes: ["Grapes"],
  coconut: ["Coconut"],
};

const asPrice = (value: string | number | undefined): number | null => {
  const price = typeof value === "number" ? value : Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
};

function redactUpstreamMessage(message: unknown, apiKey: string): string | undefined {
  if (typeof message !== "string") return undefined;
  const sanitized = message.split(apiKey).join("[redacted]").replace(/\s+/g, " ").trim();
  return sanitized ? sanitized.slice(0, 240) : undefined;
}

const getApiKey = (context: unknown, request?: Request) => {
  const headerKey = request?.headers.get("x-data-gov-key")?.trim();
  if (headerKey) return headerKey;

  // Keep this secret server-side. On Cloudflare, set it as a Worker secret named
  // DATA_GOV_IN_API_KEY; in local development, export it in the shell environment.
  const ctx = context && typeof context === "object" ? (context as Record<string, unknown>) : {};
  const cloudflare =
    ctx.cloudflare && typeof ctx.cloudflare === "object"
      ? (ctx.cloudflare as Record<string, unknown>)
      : {};
  const runtime =
    ctx.runtime && typeof ctx.runtime === "object" ? (ctx.runtime as Record<string, unknown>) : {};
  const envs = [ctx.env, cloudflare.env, runtime.env];
  for (const candidate of envs) {
    if (candidate && typeof candidate === "object") {
      const key = (candidate as Record<string, unknown>).DATA_GOV_IN_API_KEY;
      if (typeof key === "string" && key.length > 0) return key;
    }
  }

  const queryKey = request ? new URL(request.url).searchParams.get("apiKey")?.trim() : undefined;
  if (queryKey) return queryKey;

  return typeof process !== "undefined" ? process.env.DATA_GOV_IN_API_KEY : undefined;
};

export const Route = createFileRoute("/api/mandi-prices")({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        const url = new URL(request.url);
        const cropId = url.searchParams.get("crop") as CropId | null;
        const crop = CROPS.find((item) => item.id === cropId);
        if (!crop) {
          return Response.json({ error: "invalid_crop" }, { status: 400 });
        }

        const apiKey = getApiKey(context, request);
        const verifyKey = url.searchParams.get("verifyKey") === "1";
        const stateFilter =
          url.searchParams.get("state") && url.searchParams.get("state") !== "All"
            ? url.searchParams.get("state")!
            : undefined;
        const historyWindow = getPriceHistoryWindow();
        const retrievalTimestamp = new Date().toISOString();
        const marketId = url.searchParams.get("marketId");
        const selectedMarket = marketId
          ? MARKETS.find((market) => market.id === marketId)
          : undefined;
        if (marketId && !selectedMarket) {
          return Response.json({ error: "invalid_market" }, { status: 400 });
        }

        if (!apiKey) {
          const fallbackRecords = getMandiPriceRecords(crop.id, stateFilter);
          const matchingRecords = selectedMarket
            ? fallbackRecords.filter((record) => record.marketId === selectedMarket.id)
            : fallbackRecords;
          return Response.json(
            {
              records: matchingRecords,
              source: "demo",
              fetchedAt: retrievalTimestamp,
              actualRetrievalTime: retrievalTimestamp,
              latestObservationDate: null,
              historyWindow,
              dateRange: historyWindow,
              selectedDateRange: historyWindow,
              recentSevenDayHistory: [],
              historicalSeries: [],
            },
            { status: 200, headers: { "Cache-Control": "no-store" } },
          );
        }

        const state = url.searchParams.get("state");
        const records: Array<{
          id: string;
          cropId: CropId;
          cropName: string;
          marketId: string;
          marketName: string;
          state: string;
          district: string;
          arrivalDate: string;
          minPrice: number;
          maxPrice: number;
          modalPrice: number;
          priceUnit: "₹ / quintal";
          sourceName: string;
          retrievalTimestamp: string;
          freshnessStatus: "live";
          isDemo: false;
        }> = [];

        const names = CROP_COMMODITY[crop.id];
        const upstreamDiagnostics: UpstreamDiagnostic[] = [];
        let upstreamErrorCode = "UPSTREAM_REQUEST_FAILED";
        let upstreamMessage: string | undefined;
        try {
          for (const commodity of names) {
            for (let page = 0; page < (verifyKey ? 1 : 10); page += 1) {
              const upstream = new URL(API_URL);
              upstream.searchParams.set("api-key", apiKey);
              upstream.searchParams.set("format", "json");
              upstream.searchParams.set("limit", verifyKey ? "1" : "1000");
              upstream.searchParams.set("offset", String(page * 1000));
              upstream.searchParams.set("filters[commodity]", commodity);
              if (!verifyKey && state && state !== "All") {
                upstream.searchParams.set("filters[state]", state);
              }

              const response = await fetch(upstream, {
                headers: { Accept: "application/json" },
                signal: AbortSignal.timeout(12_000),
              });
              if (!response.ok) {
                upstreamErrorCode =
                  response.status === 401 || response.status === 403
                    ? "UPSTREAM_KEY_REJECTED"
                    : `UPSTREAM_HTTP_${response.status}`;
                const errorBody = (await response.json().catch(() => null)) as {
                  message?: unknown;
                } | null;
                upstreamMessage = redactUpstreamMessage(errorBody?.message, apiKey);
                console.error("data.gov.in mandi API error", response.status);
                throw new Error(`data.gov.in returned ${response.status}`);
              }

              const payload = (await response.json()) as DataGovResponse;
              if (!Array.isArray(payload.records)) {
                const message = payload.message?.toLowerCase() ?? "";
                if (
                  /(no|zero|not found|unavailable).{0,32}(records?|data|results?)/i.test(message)
                ) {
                  upstreamDiagnostics.push({
                    commodity,
                    recordCount: 0,
                    parsedRecordCount: 0,
                    rejected: {
                      invalidDate: 0,
                      invalidPrice: 0,
                      outsideDateWindow: 0,
                    },
                  });
                  break;
                }
                upstreamErrorCode = /quota|rate.?limit|too many requests/i.test(message)
                  ? "UPSTREAM_RATE_LIMIT"
                  : /(invalid|missing|incorrect|expired|unauthorized|not valid|not authorized|does not have access|doesn't have access).{0,50}(api.?key|credential|subscription)|(api.?key|credential|subscription).{0,50}(invalid|missing|incorrect|expired|unauthorized|not valid|not authorized|does not have access|doesn't have access)/i.test(
                        message,
                      )
                    ? "UPSTREAM_KEY_REJECTED"
                    : /resource|dataset/i.test(message)
                      ? "UPSTREAM_RESOURCE_ERROR"
                      : payload.message
                        ? "UPSTREAM_QUERY_REJECTED"
                        : "UPSTREAM_UNEXPECTED_RESPONSE";
                upstreamMessage = redactUpstreamMessage(payload.message, apiKey);
                throw new Error("data.gov.in returned an unexpected response format");
              }
              const rows = payload.records;
              const diagnostic: UpstreamDiagnostic = {
                commodity,
                recordCount: rows.length,
                parsedRecordCount: 0,
                rejected: {
                  invalidDate: 0,
                  invalidPrice: 0,
                  outsideDateWindow: 0,
                },
              };
              upstreamDiagnostics.push(diagnostic);
              for (const [index, row] of rows.entries()) {
                if (selectedMarket) {
                  const requestedName = normalizeMarket(selectedMarket.names.en);
                  const sourceName = normalizeMarket(row.market ?? "");
                  if (
                    !sourceName ||
                    (!sourceName.includes(requestedName) && !requestedName.includes(sourceName))
                  )
                    continue;
                }

                const arrivalDate = normalizeArrivalDate(row.arrival_date);
                const minPrice = asPrice(row.min_price);
                const maxPrice = asPrice(row.max_price);
                const modalPrice = asPrice(row.modal_price);
                if (!arrivalDate) {
                  diagnostic.rejected.invalidDate += 1;
                  continue;
                }
                if (minPrice === null || maxPrice === null || modalPrice === null) {
                  diagnostic.rejected.invalidPrice += 1;
                  continue;
                }
                if (arrivalDate < historyWindow.startDate) {
                  diagnostic.rejected.outsideDateWindow += 1;
                  continue;
                }
                records.push({
                  id: `agmarknet-${crop.id}-${row.state ?? "state"}-${row.district ?? "district"}-${row.market ?? "market"}-${arrivalDate}-${index}`,
                  cropId: crop.id,
                  cropName: crop.name,
                  marketId: selectedMarket?.id ?? "",
                  marketName: row.market?.trim() || row.district?.trim() || "APMC Market",
                  state: row.state?.trim() || "",
                  district: row.district?.trim() || "",
                  arrivalDate,
                  minPrice,
                  maxPrice,
                  modalPrice,
                  priceUnit: "₹ / quintal",
                  sourceName: "Agmarknet / data.gov.in",
                  retrievalTimestamp,
                  freshnessStatus: "live",
                  isDemo: false,
                });
                diagnostic.parsedRecordCount += 1;
              }

              if (rows.length < 1000) break;
            }
            if (verifyKey) break;
            if (records.length > 0) break;
          }

          const latestObservationDate =
            records.reduce((latest, record) => {
              if (!record.arrivalDate) return latest;
              return !latest || new Date(record.arrivalDate) > new Date(latest)
                ? record.arrivalDate
                : latest;
            }, "") || null;
          const historicRecords = records.filter(
            (record) =>
              record.arrivalDate >= historyWindow.startDate &&
              record.arrivalDate <= historyWindow.endDate,
          );
          const groupByDate = (items: typeof records) => {
            const byDate = new Map<string, typeof records>();
            for (const record of items) {
              const entries = byDate.get(record.arrivalDate) ?? [];
              entries.push(record);
              byDate.set(record.arrivalDate, entries);
            }
            return [...byDate.entries()]
              .map(([date, entries]) => ({
                date,
                minPrice: Math.round(
                  entries.reduce((sum, record) => sum + record.minPrice, 0) / entries.length,
                ),
                maxPrice: Math.round(
                  entries.reduce((sum, record) => sum + record.maxPrice, 0) / entries.length,
                ),
                modalPrice: Math.round(
                  entries.reduce((sum, record) => sum + record.modalPrice, 0) / entries.length,
                ),
              }))
              .sort((a, b) => a.date.localeCompare(b.date));
          };
          const historicalSeries = groupByDate(historicRecords);
          const recentSevenDayHistory = groupByDate(
            records.filter(
              (record) =>
                record.arrivalDate >= historyWindow.recentStartDate &&
                record.arrivalDate <= historyWindow.recentEndDate,
            ),
          );
          records.sort((a, b) => b.arrivalDate.localeCompare(a.arrivalDate));
          return Response.json(
            {
              records,
              source: records.length ? "live" : "empty",
              upstreamStatus: "ok",
              upstreamDiagnostics,
              fetchedAt: retrievalTimestamp,
              actualRetrievalTime: retrievalTimestamp,
              latestObservationDate,
              historyWindow,
              dateRange: historyWindow,
              selectedDateRange: historyWindow,
              recentSevenDayHistory,
              historicalSeries,
            },
            {
              headers: {
                "Cache-Control": verifyKey
                  ? "no-store"
                  : "public, max-age=300, s-maxage=300, stale-while-revalidate=900",
              },
            },
          );
        } catch (error) {
          console.error("Unable to fetch live mandi prices", error);
          if (
            error instanceof DOMException &&
            (error.name === "TimeoutError" || error.name === "AbortError")
          ) {
            upstreamErrorCode = "UPSTREAM_TIMEOUT";
          }
          const fallbackRecords = getMandiPriceRecords(
            crop.id,
            state && state !== "All" ? state : undefined,
          );
          const matchingRecords = selectedMarket
            ? fallbackRecords.filter((record) => record.marketId === selectedMarket.id)
            : fallbackRecords;
          return Response.json(
            {
              records: matchingRecords,
              source: "demo",
              upstreamStatus:
                upstreamErrorCode === "UPSTREAM_KEY_REJECTED" ? "key-rejected" : "error",
              upstreamErrorCode,
              fetchedAt: retrievalTimestamp,
              actualRetrievalTime: retrievalTimestamp,
              upstreamMessage,
              latestObservationDate: null,
              historyWindow,
              dateRange: historyWindow,
              selectedDateRange: historyWindow,
              recentSevenDayHistory: [],
              historicalSeries: [],
            },
            { status: 200, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});

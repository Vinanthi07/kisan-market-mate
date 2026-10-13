import { createFileRoute } from "@tanstack/react-router";
import { CROPS, type CropId } from "@/lib/data";

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

const getApiKey = (context: unknown) => {
  // Keep this secret server-side. On Cloudflare, set it as a Worker secret named
  // DATA_GOV_IN_API_KEY; in local development, export it in the shell environment.
  const ctx = context && typeof context === "object" ? (context as Record<string, unknown>) : {};
  const cloudflare = ctx.cloudflare && typeof ctx.cloudflare === "object"
    ? (ctx.cloudflare as Record<string, unknown>)
    : {};
  const runtime = ctx.runtime && typeof ctx.runtime === "object"
    ? (ctx.runtime as Record<string, unknown>)
    : {};
  const envs = [ctx.env, cloudflare.env, runtime.env];
  for (const candidate of envs) {
    if (candidate && typeof candidate === "object") {
      const key = (candidate as Record<string, unknown>).DATA_GOV_IN_API_KEY;
      if (typeof key === "string" && key.length > 0) return key;
    }
  }
  return typeof process !== "undefined" ? process.env.DATA_GOV_IN_API_KEY : undefined;
};

export const Route = createFileRoute("/api/mandi-prices")({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        const apiKey = getApiKey(context);
        if (!apiKey) {
          return Response.json(
            { error: "api_key_missing", message: "Configure the server-side DATA_GOV_IN_API_KEY secret." },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }

        const url = new URL(request.url);
        const cropId = url.searchParams.get("crop") as CropId | null;
        const crop = CROPS.find((item) => item.id === cropId);
        if (!crop) {
          return Response.json({ error: "invalid_crop" }, { status: 400 });
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
        try {
          for (const commodity of names) {
            const upstream = new URL(API_URL);
            upstream.searchParams.set("api-key", apiKey);
            upstream.searchParams.set("format", "json");
            upstream.searchParams.set("limit", "1000");
            upstream.searchParams.set("filters[commodity]", commodity);
            if (state && state !== "All") upstream.searchParams.set("filters[state]", state);

            const response = await fetch(upstream, {
              headers: { Accept: "application/json" },
              signal: AbortSignal.timeout(12_000),
            });
            if (!response.ok) {
              const detail = await response.text();
              console.error("data.gov.in mandi API error", response.status, detail.slice(0, 300));
              return Response.json(
                { error: "upstream_error", message: "The mandi price service returned an error." },
                { status: 502, headers: { "Cache-Control": "no-store" } },
              );
            }

            const payload = (await response.json()) as DataGovResponse;
            const retrievalTimestamp = new Date().toISOString();
            for (const [index, row] of (payload.records ?? []).entries()) {
              const minPrice = asPrice(row.min_price);
              const maxPrice = asPrice(row.max_price);
              const modalPrice = asPrice(row.modal_price);
              if (minPrice === null || maxPrice === null || modalPrice === null) continue;
              records.push({
                id: `agmarknet-${crop.id}-${row.state ?? "state"}-${row.district ?? "district"}-${row.market ?? "market"}-${row.arrival_date ?? index}`,
                cropId: crop.id,
                cropName: crop.name,
                marketId: "",
                marketName: row.market?.trim() || row.district?.trim() || "APMC Market",
                state: row.state?.trim() || "",
                district: row.district?.trim() || "",
                arrivalDate: row.arrival_date?.trim() || "",
                minPrice,
                maxPrice,
                modalPrice,
                priceUnit: "₹ / quintal",
                sourceName: "Agmarknet / data.gov.in",
                retrievalTimestamp,
                freshnessStatus: "live",
                isDemo: false,
              });
            }
            if (records.length > 0) break;
          }

          return Response.json(
            { records, source: "live", fetchedAt: new Date().toISOString() },
            {
              headers: {
                "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=900",
              },
            },
          );
        } catch (error) {
          console.error("Unable to fetch live mandi prices", error);
          return Response.json(
            { error: "fetch_failed", message: "Unable to reach the Agmarknet price service." },
            { status: 502, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});

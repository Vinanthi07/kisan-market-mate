import { MARKETS, priceSeries, type Crop, type Market } from "./data";

export type WeightUnit = "kg" | "quintal" | "tonne";

export const UNIT_MULTIPLIERS_TO_KG: Record<WeightUnit, number> = {
  kg: 1,
  quintal: 100,
  tonne: 1000,
};

/** Convert a weight quantity from one unit to another */
export function convertQuantity(qty: number, from: WeightUnit, to: WeightUnit): number {
  if (qty < 0) throw new Error("Quantity cannot be negative");
  const inKg = qty * UNIT_MULTIPLIERS_TO_KG[from];
  return inKg / UNIT_MULTIPLIERS_TO_KG[to];
}

/** Convert price per unit. e.g., ₹30/kg -> ₹3000/quintal */
export function convertPrice(price: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
  if (price < 0) throw new Error("Price cannot be negative");
  // price is currency / unit. If fromUnit is kg and toUnit is quintal, 1 quintal is 100 kg, so price is 100x.
  const pricePerKg = price / UNIT_MULTIPLIERS_TO_KG[fromUnit];
  return pricePerKg * UNIT_MULTIPLIERS_TO_KG[toUnit];
}

export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const r = Math.PI / 180;
  const dLat = (b[0] - a[0]) * r;
  const dLng = (b[1] - a[1]) * r;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Road estimate (1.3x straight-line). Clearly labelled as approximate. */
export const roadKm = (a: [number, number], b: [number, number]): number => haversineKm(a, b) * 1.3;

export const approximateRoadKm = (a: [number, number], b: [number, number]): number =>
  Math.round(roadKm(a, b) * 10) / 10;

export interface MarketCostBreakdown {
  expectedPricePerUnit: number; // in consistent price unit
  quantity: number; // in consistent quantity unit
  unit: WeightUnit;
  grossRevenue: number;
  transportCost: number;
  marketFees: number;
  loadingUnloadingCharges: number;
  packagingCosts: number;
  otherSellingExpenses: number;
  totalCosts: number;
  netProceeds: number;
  netProceedsPerUnit: number;
}

export interface CalculateNetProceedsInput {
  pricePerUnit: number;
  quantity: number;
  unit?: WeightUnit;
  transportCost?: number;
  marketFees?: number;
  loadingUnloadingCharges?: number;
  packagingCosts?: number;
  otherSellingExpenses?: number;
}

/**
 * Calculates net proceeds using the official specification formula:
 * Net proceeds = (expected price per unit × quantity)
 *   − transport cost
 *   − market fees
 *   − loading/unloading costs
 *   − packaging costs
 *   − other selling expenses
 */
export function calculateNetProceeds(input: CalculateNetProceedsInput): MarketCostBreakdown {
  const {
    pricePerUnit,
    quantity,
    unit = "quintal",
    transportCost = 0,
    marketFees = 0,
    loadingUnloadingCharges = 0,
    packagingCosts = 0,
    otherSellingExpenses = 0,
  } = input;

  if (quantity < 0) {
    throw new Error("Quantity cannot be negative");
  }
  if (pricePerUnit < 0) {
    throw new Error("Price per unit cannot be negative");
  }
  if (
    transportCost < 0 ||
    marketFees < 0 ||
    loadingUnloadingCharges < 0 ||
    packagingCosts < 0 ||
    otherSellingExpenses < 0
  ) {
    throw new Error("Cost components cannot be negative");
  }

  const grossRevenue = pricePerUnit * quantity;
  const totalCosts =
    transportCost + marketFees + loadingUnloadingCharges + packagingCosts + otherSellingExpenses;
  const netProceeds = grossRevenue - totalCosts;
  const netProceedsPerUnit = quantity > 0 ? netProceeds / quantity : 0;

  return {
    expectedPricePerUnit: pricePerUnit,
    quantity,
    unit,
    grossRevenue,
    transportCost,
    marketFees,
    loadingUnloadingCharges,
    packagingCosts,
    otherSellingExpenses,
    totalCosts,
    netProceeds,
    netProceedsPerUnit,
  };
}

export type MarketStatus = "best" | "okay" | "poor";

export interface CandidateMarketRecord {
  market: Market;
  expectedPricePerUnit: number;
  priceUnit: WeightUnit;
  approximateDistanceKm: number;
  isDistanceApproximate: boolean;
  transportCost: number;
  marketFees: number;
  loadingUnloadingCharges: number;
  packagingCosts: number;
  otherSellingExpenses: number;
  breakdown: MarketCostBreakdown;
  diffVsNearestNet: number | null;
  status: MarketStatus;
  isBest: boolean;
  dataSource: string;
  dataDate: string;
  freshness: "live" | "demo" | "cached";
  historicalSeries: number[];
}

export interface RankMarketsParams {
  crop: Crop;
  quantity: number;
  unit: WeightUnit;
  originCoords: [number, number];
  ratePerKmPerQuintal: number;
  manualTransportQuotes?: Record<string, number>; // marketId -> quote
  customCosts?: {
    loadingUnloadingPerQuintal?: number;
    packagingPerQuintal?: number;
    otherExpenses?: number;
  };
  maxKm?: number;
}

/**
 * Rank candidate markets by estimated net proceeds after all transport, market fees and handling.
 */
export function rankMarketsByNetProceeds(params: RankMarketsParams): CandidateMarketRecord[] {
  const {
    crop,
    quantity,
    unit,
    originCoords,
    ratePerKmPerQuintal,
    manualTransportQuotes = {},
    customCosts = {},
    maxKm = 500,
  } = params;

  if (quantity <= 0) return [];

  // Normalize quantity into quintals for calculations
  const quantityInQuintals = convertQuantity(quantity, unit, "quintal");

  const todayStr = new Date().toISOString().slice(0, 10);

  const candidateRows = MARKETS.map((m) => {
    const historicalSeries = priceSeries(crop, m);
    const modalPricePerQuintal = historicalSeries[historicalSeries.length - 1] ?? crop.basePrice;

    // Convert price to the requested display unit
    const expectedPricePerDisplayUnit = convertPrice(modalPricePerQuintal, "quintal", unit);

    const approximateDistanceKm = m.fixedKm ?? approximateRoadKm(originCoords, [m.lat, m.lng]);

    // Transport calculation: manual quote takes priority, else distance * rate * quantity in quintals
    const transportCost =
      manualTransportQuotes[m.id] !== undefined
        ? manualTransportQuotes[m.id]
        : Math.round(approximateDistanceKm * ratePerKmPerQuintal * quantityInQuintals);

    // Statutory mandi fee based on gross revenue
    const statutoryFeePct = m.feePct ?? 1.5;
    const grossRev = expectedPricePerDisplayUnit * quantity;
    const marketFees = Math.round((statutoryFeePct / 100) * grossRev);

    // Loading/unloading (default ~₹15/quintal if not specified)
    const loadingUnloadingRate = customCosts.loadingUnloadingPerQuintal ?? 15;
    const loadingUnloadingCharges = Math.round(loadingUnloadingRate * quantityInQuintals);

    // Packaging (default ~₹20/quintal for perishables/vegetables, ₹10/quintal for grains)
    const defaultPkgRate =
      crop.category === "vegetables" || crop.category === "fruits_plantation" ? 20 : 10;
    const packagingRate = customCosts.packagingPerQuintal ?? defaultPkgRate;
    const packagingCosts = Math.round(packagingRate * quantityInQuintals);

    // Other selling expenses (spoilage factor or miscellaneous handling)
    const spoilRate = crop.spoilPer100km * (approximateDistanceKm / 100);
    const estimatedSpoilLoss = Math.round(grossRev * spoilRate);
    const otherSellingExpenses = estimatedSpoilLoss + (customCosts.otherExpenses ?? 0);

    const breakdown = calculateNetProceeds({
      pricePerUnit: expectedPricePerDisplayUnit,
      quantity,
      unit,
      transportCost,
      marketFees,
      loadingUnloadingCharges,
      packagingCosts,
      otherSellingExpenses,
    });

    return {
      market: m,
      expectedPricePerUnit: expectedPricePerDisplayUnit,
      priceUnit: unit,
      approximateDistanceKm,
      isDistanceApproximate: m.fixedKm === undefined,
      transportCost,
      marketFees,
      loadingUnloadingCharges,
      packagingCosts,
      otherSellingExpenses,
      breakdown,
      diffVsNearestNet: 0,
      status: "okay" as MarketStatus,
      isBest: false,
      dataSource: "Agmarknet / DMI (AgriMarket Portal DEMO)",
      dataDate: todayStr,
      freshness: "demo" as const,
      historicalSeries,
    };
  }).filter((r) => r.approximateDistanceKm <= maxKm);

  if (candidateRows.length === 0) return [];

  // Find nearest mandi
  const mandiRows = candidateRows.filter((r) => r.market.kind === "mandi");
  const nearestMandi =
    mandiRows.length > 0
      ? mandiRows.reduce((prev, curr) =>
          curr.approximateDistanceKm < prev.approximateDistanceKm ? curr : prev,
        )
      : candidateRows[0];

  const highestNet = Math.max(...candidateRows.map((r) => r.breakdown.netProceeds));

  const ranked = candidateRows
    .map((r) => {
      const diffVsNearest = nearestMandi
        ? Math.round(r.breakdown.netProceeds - nearestMandi.breakdown.netProceeds)
        : null;

      const isBest = r.breakdown.netProceeds === highestNet && highestNet > 0;
      let status: MarketStatus = "poor";
      if (r.breakdown.netProceeds >= highestNet * 0.95) {
        status = "best";
      } else if (r.breakdown.netProceeds >= highestNet * 0.85) {
        status = "okay";
      }

      return {
        ...r,
        diffVsNearestNet: diffVsNearest,
        status,
        isBest,
      };
    })
    .sort((a, b) => b.breakdown.netProceeds - a.breakdown.netProceeds);

  return ranked;
}

/**
 * When to Sell: Decision Support
 * Transparent moving averages and storage deterioration analysis.
 * Never guarantees future prices or presents simple historical averages as a reliable forecast.
 */
export interface WhenToSellAdvisory {
  average3Day: number | null;
  average7Day: number | null;
  direction: "increasing" | "decreasing" | "mixed" | "insufficient_data";
  directionLabel: string;
  recommendation: "sell_now" | "consider_waiting" | "exercise_caution";
  headline: string;
  detailedExplanation: string;
  perishabilityWarning?: string;
  estimatedStorageCostPerDay: number;
  safeStorageLimitDays: number;
}

export function evaluateWhenToSell(
  series: number[],
  crop: Crop,
  quantityQuintals: number,
): WhenToSellAdvisory {
  if (!series || series.length < 3) {
    return {
      average3Day: null,
      average7Day: null,
      direction: "insufficient_data",
      directionLabel: "There is insufficient data to offer a useful comparison.",
      recommendation: "exercise_caution",
      headline: "Insufficient Historical Data",
      detailedExplanation:
        "At least 7 consecutive days of verified price observations are needed to determine price trajectory. Please verify prevailing spot prices at your local APMC yard.",
      estimatedStorageCostPerDay: crop.storagePerDay * quantityQuintals,
      safeStorageLimitDays: crop.shelfNormal,
    };
  }

  const last3 = series.slice(-3);
  const avg3 = Math.round(last3.reduce((a, b) => a + b, 0) / last3.length);

  const has7 = series.length >= 7;
  const last7 = has7 ? series.slice(-7) : null;
  const avg7 = last7 ? Math.round(last7.reduce((a, b) => a + b, 0) / last7.length) : null;

  const currentPrice = series[series.length - 1];
  const storageCostPerDay = Math.round(crop.storagePerDay * quantityQuintals);

  // Perishability assessment
  const isHighPerishable = crop.perishability === "high";

  let direction: WhenToSellAdvisory["direction"] = "mixed";
  let directionLabel = "The available data is mixed.";

  if (avg7 !== null) {
    if (avg3 > avg7 * 1.02 && currentPrice >= avg3) {
      direction = "increasing";
      directionLabel = "Recent observed prices are increasing.";
    } else if (avg3 < avg7 * 0.98 && currentPrice <= avg3) {
      direction = "decreasing";
      directionLabel = "Recent observed prices are decreasing.";
    }
  } else {
    if (avg3 > series[0]) {
      direction = "increasing";
      directionLabel = "Recent observed prices are increasing.";
    } else {
      direction = "decreasing";
      directionLabel = "Recent observed prices are decreasing.";
    }
  }

  // Generate advisory
  if (isHighPerishable) {
    return {
      average3Day: avg3,
      average7Day: avg7,
      direction,
      directionLabel,
      recommendation: "sell_now",
      headline: "Sell Promptly — Perishable Produce",
      detailedExplanation: `${crop.name} has high perishability with a typical farm shelf life of under ${crop.shelfNormal} days. Waiting for prospective market improvements risks substantial quality loss, moisture loss, and spoilage deductions that outweigh potential price gains.`,
      perishabilityWarning:
        "High perishability: Storage limitations make delayed selling high risk. Do not hold solely because prices recently increased.",
      estimatedStorageCostPerDay: storageCostPerDay,
      safeStorageLimitDays: crop.shelfNormal,
    };
  }

  if (direction === "increasing") {
    return {
      average3Day: avg3,
      average7Day: avg7,
      direction,
      directionLabel,
      recommendation: "consider_waiting",
      headline: "Upward Trend Observed — Safe Storage Feasible",
      detailedExplanation: `Recent 3-day average (₹${avg3}/q) is above the 7-day average (₹${avg7 ?? avg3}/q). Because ${crop.name} has low/medium perishability and safe storage up to ~${crop.shelfNormal} days, holding produce may be considered if safe, clean, dry storage is available. Estimated daily storage & handling cost is ₹${storageCostPerDay}/day for your quantity.`,
      estimatedStorageCostPerDay: storageCostPerDay,
      safeStorageLimitDays: crop.shelfNormal,
    };
  }

  if (direction === "decreasing") {
    return {
      average3Day: avg3,
      average7Day: avg7,
      direction,
      directionLabel,
      recommendation: "sell_now",
      headline: "Downward Trend Observed — Sell Promptly",
      detailedExplanation: `Recent 3-day average (₹${avg3}/q) is below the 7-day average (₹${avg7 ?? avg3}/q). Holding produce while prices fall adds storage costs (~₹${storageCostPerDay}/day) with diminishing returns.`,
      estimatedStorageCostPerDay: storageCostPerDay,
      safeStorageLimitDays: crop.shelfNormal,
    };
  }

  return {
    average3Day: avg3,
    average7Day: avg7,
    direction: "mixed",
    directionLabel: "The available data is mixed.",
    recommendation: "exercise_caution",
    headline: "Price Movement Range-Bound",
    detailedExplanation:
      "Recent 3-day and 7-day prices remain stable or fluctuating without a decisive direction. Compare current local trader offers with net proceeds at nearby mandis before making transport commitments.",
    estimatedStorageCostPerDay: storageCostPerDay,
    safeStorageLimitDays: crop.shelfNormal,
  };
}

/**
 * Farming Profit Calculator
 * Multi-factor agricultural economics engine
 */
export interface FarmingProfitInput {
  cropName: string;
  cultivatedArea: number;
  areaUnit: "acre" | "hectare" | "guntha";
  expectedYield: number;
  yieldUnit: WeightUnit;
  expectedSellingPrice: number;
  priceUnit: WeightUnit;

  // Cultivation & Production costs
  seedCost: number;
  fertilizerManureCost: number;
  labourCost: number;
  irrigationCost: number;
  machineryEquipmentCost: number;
  otherCultivationCost: number;

  // Selling & Logistics costs
  packagingCost: number;
  transportCost: number;
  mandiFees: number;
  otherSellingCost: number;
}

export interface FarmingProfitResult {
  totalYieldKg: number;
  totalYieldQuintals: number;
  grossRevenue: number;
  totalProductionCost: number;
  totalSellingLogisticsCost: number;
  totalCombinedCost: number;
  netProfitOrLoss: number;
  profitMarginPercent: number | null;
  costPerUnitQuintal: number;
  breakEvenSellingPricePerQuintal: number;
  isProfitable: boolean;
}

export function calculateFarmingProfit(input: FarmingProfitInput): FarmingProfitResult {
  const {
    cultivatedArea,
    expectedYield,
    yieldUnit,
    expectedSellingPrice,
    priceUnit,
    seedCost,
    fertilizerManureCost,
    labourCost,
    irrigationCost,
    machineryEquipmentCost,
    otherCultivationCost,
    packagingCost,
    transportCost,
    mandiFees,
    otherSellingCost,
  } = input;

  // Total yield normalized
  const totalYieldKg = convertQuantity(expectedYield, yieldUnit, "kg");
  const totalYieldQuintals = convertQuantity(expectedYield, yieldUnit, "quintal");

  // Price normalized to yield unit
  const priceInYieldUnit = convertPrice(expectedSellingPrice, priceUnit, yieldUnit);
  const grossRevenue = Math.max(0, expectedYield * priceInYieldUnit);

  const totalProductionCost =
    Math.max(0, seedCost) +
    Math.max(0, fertilizerManureCost) +
    Math.max(0, labourCost) +
    Math.max(0, irrigationCost) +
    Math.max(0, machineryEquipmentCost) +
    Math.max(0, otherCultivationCost);

  const totalSellingLogisticsCost =
    Math.max(0, packagingCost) +
    Math.max(0, transportCost) +
    Math.max(0, mandiFees) +
    Math.max(0, otherSellingCost);

  const totalCombinedCost = totalProductionCost + totalSellingLogisticsCost;
  const netProfitOrLoss = grossRevenue - totalCombinedCost;

  const profitMarginPercent = grossRevenue > 0 ? (netProfitOrLoss / grossRevenue) * 100 : null;

  const costPerUnitQuintal = totalYieldQuintals > 0 ? totalCombinedCost / totalYieldQuintals : 0;

  // Break-even price per quintal: what selling price gives Net Profit = 0
  const breakEvenSellingPricePerQuintal = costPerUnitQuintal;

  return {
    totalYieldKg,
    totalYieldQuintals,
    grossRevenue: Math.round(grossRevenue),
    totalProductionCost: Math.round(totalProductionCost),
    totalSellingLogisticsCost: Math.round(totalSellingLogisticsCost),
    totalCombinedCost: Math.round(totalCombinedCost),
    netProfitOrLoss: Math.round(netProfitOrLoss),
    profitMarginPercent:
      profitMarginPercent !== null ? Math.round(profitMarginPercent * 10) / 10 : null,
    costPerUnitQuintal: Math.round(costPerUnitQuintal * 10) / 10,
    breakEvenSellingPricePerQuintal: Math.round(breakEvenSellingPricePerQuintal * 10) / 10,
    isProfitable: netProfitOrLoss > 0,
  };
}

/** Legacy helpers maintained for backward compatibility */
export interface NetInput {
  price: number;
  distanceKm: number;
  rate: number;
  feePct: number;
  spoilPer100km: number;
}

export function netBreakdown({ price, distanceKm, rate, feePct, spoilPer100km }: NetInput) {
  const transport = distanceKm * rate;
  const fee = (feePct / 100) * price;
  const spoil = price * spoilPer100km * (distanceKm / 100);
  return { transport, fee, spoil, net: price - transport - fee - spoil };
}

export type Status = "best" | "okay" | "poor";
export interface Ranked {
  market: Market;
  price: number;
  distanceKm: number;
  transport: number;
  fee: number;
  spoil: number;
  net: number;
  status: Status;
  extra: number;
  series: number[];
}

export function rankMarkets(
  crop: Crop,
  qty: number,
  loc: [number, number],
  rate: number,
  maxKm = 450,
): Ranked[] {
  const rows = MARKETS.map((m) => {
    const series = priceSeries(crop, m);
    const price = series[series.length - 1] ?? 0;
    const distanceKm = m.fixedKm ?? approximateRoadKm(loc, [m.lat, m.lng]);
    return {
      market: m,
      price,
      distanceKm,
      series,
      ...netBreakdown({
        price,
        distanceKm,
        rate,
        feePct: m.feePct,
        spoilPer100km: crop.spoilPer100km,
      }),
    };
  }).filter((r) => r.distanceKm <= maxKm);
  const mandis = rows.filter((r) => r.market.kind === "mandi");
  if (!mandis.length) return [];
  const nearest = mandis.reduce((a, b) => (a.distanceKm < b.distanceKm ? a : b));
  const best = Math.max(...rows.map((r) => r.net));
  return rows
    .map((r) => ({
      ...r,
      extra: Math.round((r.net - nearest.net) * qty),
      status: (r.net >= best * 0.96 ? "best" : r.net >= best * 0.88 ? "okay" : "poor") as Status,
    }))
    .sort((a, b) => b.net - a.net);
}

export function waitAdvice(series: number[], crop: Crop, qty: number, useLantana = false) {
  const ys = series.slice(-30),
    n = ys.length;
  const mx = (n - 1) / 2,
    my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    den = 0;
  ys.forEach((y, i) => {
    num += (i - mx) * (y - my);
    den += (i - mx) ** 2;
  });
  const slope = den ? num / den : 0;
  const shelf = useLantana ? crop.shelfLantana : crop.shelfNormal;
  const maxDays = Math.min(10, Math.floor(shelf * 0.6));
  let bestDays = 0,
    bestGain = 0;
  for (let d = 7; d <= maxDays; d++) {
    const gain = (slope * d - crop.storagePerDay * d) * qty;
    if (gain > bestGain) {
      bestGain = gain;
      bestDays = d;
    }
  }
  return { days: bestDays, gain: Math.round(bestGain), slope };
}

export const rupees = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

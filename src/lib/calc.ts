import { MARKETS, priceSeries, type Crop, type Market } from "./data";

export function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
/** Road estimate. Swap for a routing API later. */
export const roadKm = (a: [number, number], b: [number, number]) => haversineKm(a, b) * 1.3;

export interface NetInput { price: number; distanceKm: number; rate: number; feePct: number; spoilPer100km: number; }
export function netBreakdown({ price, distanceKm, rate, feePct, spoilPer100km }: NetInput) {
  const transport = distanceKm * rate;
  const fee = (feePct / 100) * price;
  const spoil = price * spoilPer100km * (distanceKm / 100);
  return { transport, fee, spoil, net: price - transport - fee - spoil };
}

export type Status = "best" | "okay" | "poor";
export interface Ranked {
  market: Market; price: number; distanceKm: number; transport: number; fee: number; spoil: number;
  net: number; status: Status; extra: number; series: number[];
}

export function rankMarkets(crop: Crop, qty: number, loc: [number, number], rate: number, maxKm = 450): Ranked[] {
  const rows = MARKETS.map((m) => {
    const series = priceSeries(crop, m);
    const price = series[series.length - 1];
    const distanceKm = m.fixedKm ?? roadKm(loc, [m.lat, m.lng]);
    return { market: m, price, distanceKm, series, ...netBreakdown({ price, distanceKm, rate, feePct: m.feePct, spoilPer100km: crop.spoilPer100km }) };
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

/** Linear trend on last 30 days; returns best wait days (0 = sell now) and gain for the whole quantity. */
export function waitAdvice(series: number[], crop: Crop, qty: number, useLantana = false) {
  const ys = series.slice(-30), n = ys.length;
  const mx = (n - 1) / 2, my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  ys.forEach((y, i) => { num += (i - mx) * (y - my); den += (i - mx) ** 2; });
  const slope = den ? num / den : 0;
  const shelf = useLantana ? crop.shelfLantana : crop.shelfNormal;
  const maxDays = Math.min(10, Math.floor(shelf * 0.6));
  let bestDays = 0, bestGain = 0;
  for (let d = 7; d <= maxDays; d++) {
    const gain = (slope * d - crop.storagePerDay * d) * qty;
    if (gain > bestGain) { bestGain = gain; bestDays = d; }
  }
  return { days: bestDays, gain: Math.round(bestGain), slope };
}

export const rupees = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

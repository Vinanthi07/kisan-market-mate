import type { Lang } from "./i18n";

// Sample seed data so the app works before live Agmarknet data is connected.
export type CropId = "onion" | "tomato" | "maize" | "potato" | "groundnut" | "paddy";
export interface Crop {
  id: CropId; basePrice: number; trend: number; shelfNormal: number; shelfLantana: number;
  storagePerDay: number; spoilPer100km: number; yieldQ: number; inputCost: number;
}
export const CROPS: Crop[] = [
  { id: "onion", basePrice: 2200, trend: 0.004, shelfNormal: 30, shelfLantana: 60, storagePerDay: 6, spoilPer100km: 0.01, yieldQ: 100, inputCost: 70000 },
  { id: "tomato", basePrice: 1500, trend: -0.004, shelfNormal: 5, shelfLantana: 8, storagePerDay: 15, spoilPer100km: 0.04, yieldQ: 120, inputCost: 80000 },
  { id: "maize", basePrice: 2100, trend: 0.0015, shelfNormal: 90, shelfLantana: 120, storagePerDay: 2, spoilPer100km: 0.002, yieldQ: 25, inputCost: 25000 },
  { id: "potato", basePrice: 1700, trend: 0.002, shelfNormal: 30, shelfLantana: 50, storagePerDay: 5, spoilPer100km: 0.01, yieldQ: 90, inputCost: 65000 },
  { id: "groundnut", basePrice: 5800, trend: 0.001, shelfNormal: 120, shelfLantana: 150, storagePerDay: 3, spoilPer100km: 0.002, yieldQ: 8, inputCost: 28000 },
  { id: "paddy", basePrice: 2250, trend: 0.0008, shelfNormal: 180, shelfLantana: 240, storagePerDay: 1.5, spoilPer100km: 0.001, yieldQ: 22, inputCost: 30000 },
];
export const cropById = (id: CropId) => CROPS.find((c) => c.id === id)!;

export interface Market {
  id: string; names: Partial<Record<Lang, string>> & { en: string }; state: string;
  lat: number; lng: number; feePct: number; kind: "mandi" | "direct"; factor: number;
  phone?: string; fixedKm?: number;
}
export const MARKETS: Market[] = [
  { id: "ypr", names: { en: "Yeshwanthpur", kn: "ಯಶವಂತಪುರ", hi: "यशवंतपुर" }, state: "Karnataka", lat: 13.02, lng: 77.55, feePct: 2, kind: "mandi", factor: 1.08 },
  { id: "klr", names: { en: "Kolar", kn: "ಕೋಲಾರ", hi: "कोलार" }, state: "Karnataka", lat: 13.14, lng: 78.13, feePct: 1.5, kind: "mandi", factor: 1.0 },
  { id: "hbl", names: { en: "Hubballi", kn: "ಹುಬ್ಬಳ್ಳಿ", hi: "हुबली" }, state: "Karnataka", lat: 15.36, lng: 75.12, feePct: 1.5, kind: "mandi", factor: 1.02 },
  { id: "mys", names: { en: "Mysuru", kn: "ಮೈಸೂರು", hi: "मैसूर" }, state: "Karnataka", lat: 12.3, lng: 76.64, feePct: 1.5, kind: "mandi", factor: 0.98 },
  { id: "cbp", names: { en: "Chikkaballapur", kn: "ಚಿಕ್ಕಬಳ್ಳಾಪುರ", hi: "चिकबल्लापुर" }, state: "Karnataka", lat: 13.43, lng: 77.73, feePct: 1.5, kind: "mandi", factor: 0.96 },
  { id: "kyb", names: { en: "Koyambedu", ta: "கோயம்பேடு", hi: "कोयम्बेडु" }, state: "Tamil Nadu", lat: 13.07, lng: 80.19, feePct: 2, kind: "mandi", factor: 1.12 },
  { id: "odc", names: { en: "Oddanchatram", ta: "ஒட்டன்சத்திரம்", hi: "ओड्डनछत्रम" }, state: "Tamil Nadu", lat: 10.48, lng: 77.75, feePct: 1, kind: "mandi", factor: 1.0 },
  { id: "cbe", names: { en: "Coimbatore", ta: "கோயம்புத்தூர்", hi: "कोयंबटूर" }, state: "Tamil Nadu", lat: 11.02, lng: 76.96, feePct: 1.5, kind: "mandi", factor: 1.03 },
  { id: "hsr", names: { en: "Hosur", ta: "ஓசூர்", hi: "होसुर" }, state: "Tamil Nadu", lat: 12.74, lng: 77.83, feePct: 1, kind: "mandi", factor: 1.01 },
  { id: "lsg", names: { en: "Lasalgaon", mr: "लासलगाव", hi: "लासलगांव" }, state: "Maharashtra", lat: 20.15, lng: 74.23, feePct: 1, kind: "mandi", factor: 1.05 },
  { id: "pne", names: { en: "Pune", mr: "पुणे", hi: "पुणे" }, state: "Maharashtra", lat: 18.49, lng: 73.86, feePct: 2, kind: "mandi", factor: 1.1 },
  { id: "nsk", names: { en: "Nashik", mr: "नाशिक", hi: "नासिक" }, state: "Maharashtra", lat: 20.0, lng: 73.79, feePct: 1.5, kind: "mandi", factor: 1.02 },
  { id: "slp", names: { en: "Solapur", mr: "सोलापूर", hi: "सोलापुर" }, state: "Maharashtra", lat: 17.66, lng: 75.91, feePct: 1.5, kind: "mandi", factor: 0.97 },
  { id: "mdp", names: { en: "Madanapalle", te: "మదనపల్లె", hi: "मदनपल्ले" }, state: "Andhra Pradesh", lat: 13.55, lng: 78.5, feePct: 1, kind: "mandi", factor: 1.04 },
  { id: "knl", names: { en: "Kurnool", te: "కర్నూలు", hi: "कुरनूल" }, state: "Andhra Pradesh", lat: 15.83, lng: 78.04, feePct: 1.5, kind: "mandi", factor: 0.99 },
  { id: "bwp", names: { en: "Bowenpally", te: "బోయిన్‌పల్లి", hi: "बोवेनपल्ली" }, state: "Telangana", lat: 17.47, lng: 78.48, feePct: 2, kind: "mandi", factor: 1.09 },
  { id: "gnt", names: { en: "Guntur", te: "గుంటూరు", hi: "गुंटूर" }, state: "Andhra Pradesh", lat: 16.3, lng: 80.44, feePct: 1.5, kind: "mandi", factor: 1.0 },
  { id: "d-app", names: { en: "FreshCart App", hi: "फ्रेशकार्ट ऐप" }, state: "", lat: 0, lng: 0, feePct: 0, kind: "direct", factor: 1.04, fixedKm: 8, phone: "+919800000001" },
  { id: "d-fpo", names: { en: "Village FPO", hi: "गाँव FPO" }, state: "", lat: 0, lng: 0, feePct: 0, kind: "direct", factor: 1.01, fixedKm: 4, phone: "+919800000002" },
];
export const marketName = (m: Market, lang: Lang) => m.names[lang] ?? m.names.en;

export const STATES = {
  Karnataka: { Kolar: [13.14, 78.13], "Bengaluru Rural": [13.28, 77.53], Mysuru: [12.3, 76.64], Dharwad: [15.46, 75.0] },
  "Tamil Nadu": { Krishnagiri: [12.52, 78.21], Dindigul: [10.36, 77.98], Coimbatore: [11.02, 76.96], Chennai: [13.08, 80.27] },
  Maharashtra: { Nashik: [20.0, 73.79], Pune: [18.52, 73.86], Solapur: [17.66, 75.91], Ahmednagar: [19.09, 74.74] },
  "Andhra Pradesh": { Chittoor: [13.22, 79.1], Kurnool: [15.83, 78.04], Guntur: [16.3, 80.44] },
  Telangana: { Hyderabad: [17.38, 78.48], Rangareddy: [17.23, 78.27], Warangal: [17.97, 79.59] },
} as Record<string, Record<string, [number, number]>>;

function hash(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }

/** 60-day deterministic sample modal price series, oldest first. */
export function priceSeries(crop: Crop, m: Market, days = 60): number[] {
  const seed = hash(crop.id + m.id);
  const mf = m.factor * (0.95 + (seed % 100) / 1000);
  return Array.from({ length: days }, (_, i) => {
    const t = i - days + 1;
    const wave = 0.04 * Math.sin((i + seed) / 6);
    const noise = (((seed * (i + 7)) % 97) / 97 - 0.5) * 0.03;
    return Math.round(crop.basePrice * mf * (1 + crop.trend * t + wave + noise));
  });
}

export const PRICE_DATE = new Date().toISOString().slice(0, 10);

export interface Buyer { id: string; name: string; crop: CropId; price: number; weeklyQ: number; phone: string; }
export const BUYERS: Buyer[] = [
  { id: "b1", name: "FreshCart", crop: "tomato", price: 1650, weeklyQ: 40, phone: "+919800000001" },
  { id: "b2", name: "Kolar FPO", crop: "onion", price: 2350, weeklyQ: 60, phone: "+919800000002" },
  { id: "b3", name: "GreenBasket", crop: "potato", price: 1800, weeklyQ: 30, phone: "+919800000003" },
  { id: "b4", name: "Deccan Mills", crop: "maize", price: 2200, weeklyQ: 120, phone: "+919800000004" },
  { id: "b5", name: "Sri Oil Works", crop: "groundnut", price: 6000, weeklyQ: 25, phone: "+919800000005" },
  { id: "b6", name: "Annapurna Rice", crop: "paddy", price: 2350, weeklyQ: 200, phone: "+919800000006" },
];

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DICTS, type Lang } from "./i18n";
import type { CropId } from "./data";

export interface Loc { lat: number; lng: number; state: string; district: string; village: string; }
export interface Settings {
  lang: Lang; onboarded: boolean; loc: Loc | null; crop: CropId; qty: number;
  rate: number; myVehicle: boolean; vehicleRate: number; theme: "light" | "dark";
}
const DEFAULTS: Settings = {
  lang: "en", onboarded: false, loc: null, crop: "onion", qty: 10,
  rate: 1.8, myVehicle: false, vehicleRate: 1.2, theme: "light",
};
const KEY = "kisanmandi.settings";

interface Ctx { s: Settings; set: (p: Partial<Settings>) => void; ready: boolean; t: (typeof DICTS)["en"]; }
const C = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setS({ ...DEFAULTS, ...JSON.parse(raw) }); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(s));
    document.documentElement.classList.toggle("dark", s.theme === "dark");
    document.documentElement.lang = s.lang;
  }, [s, ready]);
  const set = (p: Partial<Settings>) => setS((o) => ({ ...o, ...p }));
  return <C.Provider value={{ s, set, ready, t: DICTS[s.lang] }}>{children}</C.Provider>;
}
export function useSettings() {
  const c = useContext(C);
  if (!c) throw new Error("SettingsProvider missing");
  return c;
}

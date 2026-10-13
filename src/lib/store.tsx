import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DICTS, type Dict, type Lang } from "./i18n";
import type { CropId } from "./data";
import type { WeightUnit } from "./calc";

export interface Loc {
  lat: number;
  lng: number;
  state: string;
  district: string;
  village: string;
}

export interface Settings {
  lang: Lang;
  onboarded: boolean;
  loc: Loc | null;
  crop: CropId;
  qty: number;
  unit: WeightUnit;
  rate: number;
  myVehicle: boolean;
  vehicleRate: number;
  theme: "light" | "dark";
  farmerName: string;
  farmerPhone: string;
}

const DEFAULTS: Settings = {
  lang: "en",
  onboarded: false,
  loc: {
    lat: 13.14,
    lng: 78.13,
    state: "Karnataka",
    district: "Kolar",
    village: "Vokkaleri",
  },
  crop: "tomato",
  qty: 10,
  unit: "quintal",
  rate: 1.8,
  myVehicle: false,
  vehicleRate: 1.2,
  theme: "light",
  farmerName: "Kisan Bandhu",
  farmerPhone: "",
};

const KEY = "kisansaathi.settings";

interface Ctx {
  s: Settings;
  set: (p: Partial<Settings>) => void;
  ready: boolean;
  t: Dict;
}

const C = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        setS({ ...DEFAULTS, ...JSON.parse(raw) });
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(s));
    document.documentElement.classList.toggle("dark", s.theme === "dark");
    document.documentElement.lang = s.lang;
  }, [s, ready]);

  const set = (p: Partial<Settings>) => setS((o) => ({ ...o, ...p }));

  const currentDict = DICTS[s.lang] ?? DICTS.en;

  return <C.Provider value={{ s, set, ready, t: currentDict }}>{children}</C.Provider>;
}

export function useSettings() {
  const c = useContext(C);
  if (!c) throw new Error("SettingsProvider missing");
  return c;
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Languages, LocateFixed, MapPin, Sprout } from "lucide-react";
import { useEffect, useState } from "react";
import { CropPicker } from "@/components/CropPicker";
import { LANGS } from "@/lib/i18n";
import { STATES } from "@/lib/data";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KisanMandi — Sell your crop for the best price" },
      { name: "description", content: "Find the mandi that pays the most after transport, in your language, with voice." },
      { property: "og:title", content: "KisanMandi — Sell your crop for the best price" },
      { property: "og:description", content: "Compare mandis by net profit after transport, fees and spoilage." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { s, set, t, ready } = useSettings();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [gpsFail, setGpsFail] = useState(false);
  const [state, setState] = useState("Karnataka");
  const [district, setDistrict] = useState("Kolar");
  const [village, setVillage] = useState("");

  useEffect(() => { if (ready && s.onboarded) nav({ to: "/sell" }); }, [ready, s.onboarded, nav]);

  const gps = () => navigator.geolocation?.getCurrentPosition(
    (p) => { set({ loc: { lat: p.coords.latitude, lng: p.coords.longitude, state: "", district: "", village: "GPS" } }); setStep(2); },
    () => setGpsFail(true), { timeout: 10000 });

  const pick = () => {
    const [lat, lng] = STATES[state][district];
    set({ loc: { lat, lng, state, district, village } }); setStep(2);
  };

  const big = "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-xl font-bold text-primary-foreground";
  const sel = "min-h-12 w-full rounded-xl border bg-card px-3 text-lg";

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 p-4">
      <div className="flex items-center justify-center gap-2" aria-label="Steps">
        {[Languages, MapPin, Sprout].map((I, i) => (
          <div key={i} className={`flex size-12 items-center justify-center rounded-full ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}><I className="size-6" aria-hidden /></div>
        ))}
      </div>

      {step === 0 && (<>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><Languages className="size-8 text-primary" />{t.chooseLanguage}</h1>
        <div className="grid grid-cols-2 gap-3">
          {LANGS.map((l) => (
            <button key={l.code} onClick={() => set({ lang: l.code })} aria-pressed={s.lang === l.code}
              className={`flex min-h-20 items-center justify-center gap-2 rounded-2xl border-2 text-2xl font-bold ${s.lang === l.code ? "border-primary bg-primary/10" : "bg-card"}`}>
              {s.lang === l.code && <Check className="size-6 text-primary" />}{l.native}
            </button>
          ))}
        </div>
        <button className={big} onClick={() => setStep(1)}>{t.next}<ArrowRight className="size-6" /></button>
      </>)}

      {step === 1 && (<>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><MapPin className="size-8 text-primary" />{t.location}</h1>
        <button className={big} onClick={gps}><LocateFixed className="size-7" />{t.useGps}</button>
        {gpsFail && <p role="alert" className="rounded-lg bg-muted p-3 text-lg">{t.gpsFail}</p>}
        <label className="grid gap-1 text-lg font-semibold">{t.state}
          <select className={sel} value={state} onChange={(e) => { setState(e.target.value); setDistrict(Object.keys(STATES[e.target.value])[0]); }}>
            {Object.keys(STATES).map((x) => <option key={x}>{x}</option>)}
          </select></label>
        <label className="grid gap-1 text-lg font-semibold">{t.district}
          <select className={sel} value={district} onChange={(e) => setDistrict(e.target.value)}>
            {Object.keys(STATES[state]).map((x) => <option key={x}>{x}</option>)}
          </select></label>
        <label className="grid gap-1 text-lg font-semibold">{t.village}
          <input className={sel} value={village} onChange={(e) => setVillage(e.target.value)} /></label>
        <button className={big} onClick={pick}>{t.next}<ArrowRight className="size-6" /></button>
      </>)}

      {step === 2 && (<>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><Sprout className="size-8 text-primary" />{t.chooseCrop}</h1>
        <CropPicker grid value={s.crop} onChange={(crop) => set({ crop })} />
        <button className={big} onClick={() => { set({ onboarded: true }); nav({ to: "/sell" }); }}>{t.start}<ArrowRight className="size-6" /></button>
      </>)}
    </main>
  );
}

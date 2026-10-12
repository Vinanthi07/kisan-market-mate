import { Mic } from "lucide-react";
import { useState } from "react";
import { CROPS, type CropId } from "@/lib/data";
import { DICTS } from "@/lib/i18n";
import { useSettings } from "@/lib/store";
import { getRecognition } from "@/lib/voice";
import { CropArt } from "./CropArt";

export function CropPicker({ value, onChange, grid = false }: { value: CropId; onChange: (c: CropId) => void; grid?: boolean }) {
  const { s, t } = useSettings();
  const [listening, setListening] = useState(false);
  const rec = typeof window !== "undefined" ? getRecognition(s.lang) : null;

  const listen = () => {
    const r = getRecognition(s.lang);
    if (!r) return;
    setListening(true);
    r.onresult = (e) => {
      const said = (e.results[0]?.[0]?.transcript ?? "").toLowerCase();
      const hit = CROPS.find((c) => Object.values(DICTS).some((d) => said.includes(d[c.id].toLowerCase())));
      if (hit) onChange(hit.id);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
  };

  return (
    <div>
      <div className={grid ? "grid grid-cols-3 gap-2 [&>button]:w-auto" : "flex gap-2 overflow-x-auto pb-1"} role="radiogroup" aria-label={t.chooseCrop}>
        {CROPS.map((c) => (
          <button key={c.id} role="radio" aria-checked={value === c.id} onClick={() => onChange(c.id)}
            className={`flex w-28 shrink-0 flex-col items-center gap-1 rounded-2xl border-2 p-2 text-center text-base font-semibold leading-tight break-words ${value === c.id ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
            <CropArt id={c.id} size={grid ? 72 : 52} />
            <span>{t[c.id]}</span>
          </button>
        ))}
      </div>
      {rec && (
        <button onClick={listen} className="mt-2 flex min-h-12 items-center gap-2 rounded-xl border px-4 text-base font-semibold" aria-label={t.speak}>
          <Mic className={`size-6 ${listening ? "text-destructive" : ""}`} aria-hidden />{listening ? t.listening : t.speak}
        </button>
      )}
    </div>
  );
}

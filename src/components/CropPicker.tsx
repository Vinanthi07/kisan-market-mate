import { Mic, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CROPS, CROP_CATEGORIES, type CropCategory, type CropId } from "@/lib/data";
import { DICTS } from "@/lib/i18n";
import { useSettings } from "@/lib/store";
import { getRecognition } from "@/lib/voice";
import { CropArt } from "./CropArt";

export function CropPicker({
  value,
  onChange,
  grid = false,
  showCategoryFilter = true,
}: {
  value: CropId;
  onChange: (c: CropId) => void;
  grid?: boolean;
  showCategoryFilter?: boolean;
}) {
  const { s, t } = useSettings();
  const [activeCategory, setActiveCategory] = useState<CropCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [listening, setListening] = useState(false);
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);

  useEffect(() => {
    setRecognitionAvailable(Boolean(getRecognition(s.lang)));
  }, [s.lang]);

  const listen = () => {
    const r = getRecognition(s.lang);
    if (!r) return;
    setListening(true);
    r.onresult = (e) => {
      const said = (e.results[0]?.[0]?.transcript ?? "").toLowerCase();
      const hit = CROPS.find((c) => {
        const enName = c.name.toLowerCase();
        const locName = (c.localizedNames[s.lang] ?? "").toLowerCase();
        return (
          said.includes(enName) ||
          said.includes(locName) ||
          Object.values(DICTS).some((d) => (d[c.id] ? said.includes(d[c.id].toLowerCase()) : false))
        );
      });
      if (hit) onChange(hit.id);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
  };

  const filteredCrops = useMemo(() => {
    return CROPS.filter((c) => {
      const matchesCategory = activeCategory === "all" || c.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.localizedNames[s.lang] ?? "").toLowerCase().includes(q) ||
        (t[c.id] ?? "").toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, s.lang, t]);

  return (
    <div className="space-y-2">
      {/* Search and Voice Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t.searchCropPlaceholder || "Search crop (e.g. Tomato, Ragi)..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {recognitionAvailable && (
          <button
            type="button"
            onClick={listen}
            className={`flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors ${
              listening
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-card hover:bg-muted"
            }`}
            aria-label={t.speak}
          >
            <Mic className="size-4" />
            <span className="hidden sm:inline">{listening ? t.listening : t.speak}</span>
          </button>
        )}
      </div>

      {/* Category Pills */}
      {showCategoryFilter && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`shrink-0 rounded-full px-3 py-1 font-medium transition-colors ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground font-bold"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t.allCrops || "All Crops"} ({CROPS.length})
          </button>
          {CROP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-full px-3 py-1 font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat.label[s.lang] ?? cat.label.en}
            </button>
          ))}
        </div>
      )}

      {/* Crop List */}
      <div
        className={
          grid
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto p-0.5"
            : "flex gap-2.5 overflow-x-auto pb-2 pt-1"
        }
        role="radiogroup"
        aria-label={t.chooseCrop}
      >
        {filteredCrops.map((c) => {
          const isSelected = value === c.id;
          const displayName = c.localizedNames[s.lang] ?? t[c.id] ?? c.name;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(c.id)}
              className={`flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 text-center transition-all ${
                grid ? "w-auto" : "w-28"
              } ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                  : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
              }`}
            >
              <CropArt id={c.id} size={grid ? 48 : 44} />
              <span className="text-xs font-bold leading-tight line-clamp-2 text-foreground">
                {displayName}
              </span>
              <span className="text-[10px] text-muted-foreground">~₹{c.basePrice}/q</span>
            </button>
          );
        })}
      </div>

      {filteredCrops.length === 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t.noCropsFound || "No crops match your filter."}
        </p>
      )}
    </div>
  );
}

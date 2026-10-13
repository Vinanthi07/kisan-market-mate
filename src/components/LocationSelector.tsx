import { AlertCircle, Check, Compass, LocateFixed, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { LOCATION_DATA, STATES, type Loc } from "@/lib/data";
import { useSettings } from "@/lib/store";

export function LocationSelector({
  value,
  onChange,
  onClose,
}: {
  value: Loc | null;
  onChange: (loc: Loc) => void;
  onClose?: () => void;
}) {
  const { t } = useSettings();
  const [mode, setMode] = useState<"hierarchy" | "manual">("hierarchy");
  const [selectedState, setSelectedState] = useState<string>(value?.state || "Karnataka");
  const [selectedDistrict, setSelectedDistrict] = useState<string>(value?.district || "Kolar");
  const [selectedTaluk, setSelectedTaluk] = useState<string>("");
  const [selectedVillage, setSelectedVillage] = useState<string>(value?.village || "");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Manual fallback fields
  const [manualState, setManualState] = useState(value?.state || "");
  const [manualDistrict, setManualDistrict] = useState(value?.district || "");
  const [manualTaluk, setManualTaluk] = useState("");
  const [manualVillage, setManualVillage] = useState(value?.village || "");

  const stateData = useMemo(() => {
    return LOCATION_DATA[selectedState] ?? null;
  }, [selectedState]);

  const districtList = useMemo(() => {
    if (stateData) return stateData.districts;
    const flatDistricts = Object.keys(STATES[selectedState] ?? {});
    return flatDistricts.map((d) => ({
      name: d,
      lat: STATES[selectedState][d][0],
      lng: STATES[selectedState][d][1],
      taluks: [],
    }));
  }, [selectedState, stateData]);

  const currentDistrictObj = useMemo(() => {
    return districtList.find((d) => d.name === selectedDistrict);
  }, [districtList, selectedDistrict]);

  const talukList = useMemo(() => {
    return currentDistrictObj?.taluks ?? [];
  }, [currentDistrictObj]);

  const currentTalukObj = useMemo(() => {
    return talukList.find((tl) => tl.name === selectedTaluk);
  }, [talukList, selectedTaluk]);

  const villageList = useMemo(() => {
    return currentTalukObj?.villages ?? [];
  }, [currentTalukObj]);

  const handleStateChange = (st: string) => {
    setSelectedState(st);
    const firstDistrict =
      LOCATION_DATA[st]?.districts[0]?.name ?? Object.keys(STATES[st] ?? {})[0] ?? "";
    setSelectedDistrict(firstDistrict);
    setSelectedTaluk("");
    setSelectedVillage("");
  };

  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    setSelectedTaluk("");
    setSelectedVillage("");
  };

  const handleApplyHierarchy = () => {
    let lat = 13.14;
    let lng = 78.13;

    // Check if village has exact coordinates
    const vMatch = villageList.find((v) => v.name === selectedVillage);
    if (vMatch) {
      lat = vMatch.lat;
      lng = vMatch.lng;
    } else if (currentDistrictObj) {
      lat = currentDistrictObj.lat;
      lng = currentDistrictObj.lng;
    } else if (STATES[selectedState]?.[selectedDistrict]) {
      [lat, lng] = STATES[selectedState][selectedDistrict];
    }

    const loc: Loc = {
      lat,
      lng,
      state: selectedState,
      district: selectedDistrict,
      village: selectedVillage || selectedTaluk || selectedDistrict,
    };
    onChange(loc);
    onClose?.();
  };

  const handleApplyManual = () => {
    if (!manualDistrict.trim()) return;
    const loc: Loc = {
      lat: 13.14, // default safe center
      lng: 78.13,
      state: manualState.trim() || "India",
      district: manualDistrict.trim(),
      village: manualVillage.trim() || manualTaluk.trim() || manualDistrict.trim(),
    };
    onChange(loc);
    onClose?.();
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser. Please select manually.");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const lat = Math.round(pos.coords.latitude * 1000) / 1000;
        const lng = Math.round(pos.coords.longitude * 1000) / 1000;

        // Approximate state/district matching or GPS label
        const loc: Loc = {
          lat,
          lng,
          state: "Detected (GPS)",
          district: `${lat}°, ${lng}°`,
          village: "Current Location",
        };
        onChange(loc);
        onClose?.();
      },
      (err) => {
        setGpsLoading(false);
        let msg = "Could not obtain location. Please select your district below.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission was denied. You can select your state and district below.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out. Please select from the list.";
        }
        setGpsError(msg);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-primary" />
          <h3 className="font-display text-lg font-bold text-foreground">
            {t.location || "Select Your Location"}
          </h3>
        </div>
        <div className="flex rounded-lg border bg-muted/40 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("hierarchy")}
            className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
              mode === "hierarchy" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
            }`}
          >
            Select List
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
              mode === "manual" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
            }`}
          >
            Manual Entry
          </button>
        </div>
      </div>

      {/* GPS Trigger Button */}
      <div>
        <button
          type="button"
          onClick={handleUseGps}
          disabled={gpsLoading}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 text-sm font-bold text-primary hover:bg-primary/15 transition-colors disabled:opacity-50"
        >
          <LocateFixed className={`size-4 ${gpsLoading ? "animate-spin" : ""}`} />
          {gpsLoading ? "Detecting location..." : t.useGps || "Use My GPS Location"}
        </button>
        {gpsError && (
          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      {mode === "hierarchy" ? (
        <div className="space-y-3">
          {/* Country (Fixed to India with note) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Country</label>
              <input
                disabled
                value="India 🇮🇳"
                className="h-10 w-full rounded-xl border bg-muted/30 px-3 text-sm font-medium text-foreground cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                {t.state || "State"}
              </label>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary"
              >
                {Object.keys(STATES).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* District & Taluk */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                {t.district || "District"}
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary"
              >
                {districtList.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Taluk / Subdistrict
              </label>
              <select
                value={selectedTaluk}
                onChange={(e) => setSelectedTaluk(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary"
              >
                <option value="">(All or nearby)</option>
                {talukList.map((tl) => (
                  <option key={tl.name} value={tl.name}>
                    {tl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Village / Locality */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              {t.village || "Village or Locality (Optional)"}
            </label>
            {villageList.length > 0 ? (
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Village</option>
                {villageList.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Enter village or panchayat name..."
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:ring-2 focus:ring-primary"
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleApplyHierarchy}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Check className="size-4" />
            Set Location: {selectedDistrict}, {selectedState}
          </button>
        </div>
      ) : (
        /* Manual Fallback Entry */
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Type your location manually if your state or taluk is not listed in the quick menu.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">State</label>
              <input
                type="text"
                placeholder="e.g. Karnataka"
                value={manualState}
                onChange={(e) => setManualState(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">District *</label>
              <input
                type="text"
                placeholder="e.g. Belagavi"
                value={manualDistrict}
                onChange={(e) => setManualDistrict(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Taluk / Tehsil</label>
              <input
                type="text"
                placeholder="e.g. Gokak"
                value={manualTaluk}
                onChange={(e) => setManualTaluk(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Village / Locality
              </label>
              <input
                type="text"
                placeholder="e.g. Konnur"
                value={manualVillage}
                onChange={(e) => setManualVillage(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyManual}
            disabled={!manualDistrict.trim()}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Check className="size-4" />
            Save Manual Location
          </button>
        </div>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Info,
  MapPin,
  Plus,
  Route as RouteIcon,
  Shield,
  ShieldAlert,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Page } from "@/components/AppShell";
import { approximateRoadKm, rupees } from "@/lib/calc";
import { MARKETS, TRANSPORT_VEHICLES, type TransportVehicleOption } from "@/lib/data";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/transport")({
  head: () => ({
    meta: [
      { title: "Transport Coordination & Load Sharing | KisanSaathi" },
      {
        name: "description",
        content:
          "Coordinate vehicle capacity, compare manual freight quotes, and estimate shared-transport savings for APMC mandi transit.",
      },
    ],
  }),
  component: TransportCoordinationPage,
});

interface TransportPoolRequest {
  id: string;
  farmerName: string;
  farmerPhone: string;
  origin: string;
  destinationMandi: string;
  produceQtyQ: number;
  vehicleType: string;
  preferredDate: string;
  quotedPrice: number | null;
  status: "quotation_entered" | "pool_request_submitted" | "verified_booking";
}

const STORAGE_KEY = "kisansaathi.transport_requests";

function TransportCoordinationPage() {
  const { s, t } = useSettings();
  const [originText, setOriginText] = useState(
    s.loc ? `${s.loc.village || s.loc.district}, ${s.loc.state}` : "Kolar, Karnataka",
  );
  const [destMandiId, setDestMandiId] = useState<string>("ypr");
  const [produceQtyQuintals, setProduceQtyQuintals] = useState<number>(s.qty || 15);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("pickup");
  const [preferredDate, setPreferredDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );
  const [manualQuotedPrice, setManualQuotedPrice] = useState<string>("");
  const [isSharedPool, setIsSharedPool] = useState<boolean>(true);
  const [poolPartnersCount, setPoolPartnersCount] = useState<number>(2);

  // Stored pooling requests
  const [requests, setRequests] = useState<TransportPoolRequest[]>([]);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRequests(JSON.parse(stored));
    } catch {
      /* ignore */
    }
  }, []);

  const destMarket = useMemo(
    () => MARKETS.find((m) => m.id === destMandiId) ?? MARKETS[0],
    [destMandiId],
  );
  const vehicle = useMemo(
    () => TRANSPORT_VEHICLES.find((v) => v.id === selectedVehicleId) ?? TRANSPORT_VEHICLES[0],
    [selectedVehicleId],
  );

  const userCoords: [number, number] = useMemo(
    () => (s.loc ? [s.loc.lat, s.loc.lng] : [13.14, 78.13]),
    [s.loc],
  );

  // Approximate road distance
  const approxDistanceKm = useMemo(() => {
    return destMarket.fixedKm ?? approximateRoadKm(userCoords, [destMarket.lat, destMarket.lng]);
  }, [destMarket, userCoords]);

  // Estimated Freight Calculations
  const estimatedSoloFreight = Math.round(approxDistanceKm * vehicle.estimatedBaseRatePerKm);
  const userEnteredOrEstSolo =
    Number(manualQuotedPrice) > 0 ? Number(manualQuotedPrice) : estimatedSoloFreight;

  // Shared pooling freight: splits base vehicle hiring cost across pooling partners
  const sharedCostPerFarmer = Math.round(userEnteredOrEstSolo / Math.max(1, poolPartnersCount));
  const estimatedSavings = userEnteredOrEstSolo - sharedCostPerFarmer;

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = (s.farmerPhone || "9845012345").replace(/\D/g, "");

    const newReq: TransportPoolRequest = {
      id: "tr-" + Math.floor(1000 + Math.random() * 9000),
      farmerName: s.farmerName || "Farmer Member",
      farmerPhone: cleanPhone,
      origin: originText.trim(),
      destinationMandi: destMarket.names.en,
      produceQtyQ: produceQtyQuintals,
      vehicleType: vehicle.name,
      preferredDate,
      quotedPrice: Number(manualQuotedPrice) > 0 ? Number(manualQuotedPrice) : null,
      status: Number(manualQuotedPrice) > 0 ? "quotation_entered" : "pool_request_submitted",
    };

    const updated = [newReq, ...requests];
    setRequests(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setSubmittedMsg(
      `Transport request #${newReq.id} recorded. Share details with village transporter.`,
    );
    setTimeout(() => setSubmittedMsg(null), 4000);
  };

  return (
    <Page>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="size-6 text-primary" />
              <h1 className="font-display text-2xl font-extrabold text-foreground">
                {t.transport || "Transport Coordination & Load Sharing"}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Match vehicle capacity, compare driver freight quotes, and pool vehicle loads with
              neighbors.
            </p>
          </div>
        </div>

        {/* Status Distinction Notice (Per Master Prompt Section 15) */}
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800/50 p-3.5 text-xs text-amber-950 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldAlert className="size-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>Transport Quotation & Booking Verification Transparency</span>
          </div>
          <p className="leading-relaxed">
            Distances shown are approximate straight-line × 1.3 road estimates, not live satellite
            routing. Prices displayed are standard regional benchmarks or farmer-entered driver
            quotes. A vehicle is <strong>never confirmed booked</strong> until direct arrangement
            with a verified transporter.
          </p>
        </div>

        {submittedMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-100 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{submittedMsg}</span>
          </div>
        )}

        {/* Inputs Card */}
        <form
          onSubmit={handleSubmitRequest}
          className="rounded-3xl border bg-card p-5 shadow-2xs space-y-4"
        >
          <h2 className="font-display text-base font-bold text-foreground">
            Plan Market Freight & Vehicle Hire
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Origin Village / Farm Gate
              </label>
              <input
                type="text"
                required
                value={originText}
                onChange={(e) => setOriginText(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Destination APMC Mandi
              </label>
              <select
                value={destMandiId}
                onChange={(e) => setDestMandiId(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 font-semibold focus:ring-2 focus:ring-primary"
              >
                {MARKETS.filter((m) => m.kind === "mandi").map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.names.en} ({m.district}, {m.state})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Your Produce Quantity (Quintals)
              </label>
              <input
                type="number"
                min={1}
                value={produceQtyQuintals}
                onChange={(e) => setProduceQtyQuintals(Math.max(1, Number(e.target.value) || 1))}
                className="h-10 w-full rounded-xl border bg-background px-3 font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Vehicle Type Needed
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 font-semibold focus:ring-2 focus:ring-primary"
              >
                {TRANSPORT_VEHICLES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} (Cap: {v.capacityQuintals}q)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Preferred Travel Date
              </label>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t">
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Transporter Quoted Price (Optional ₹)
              </label>
              <input
                type="number"
                placeholder="Leave blank to use distance benchmark"
                value={manualQuotedPrice}
                onChange={(e) => setManualQuotedPrice(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 font-bold"
              />
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-2 font-semibold text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSharedPool}
                  onChange={(e) => setIsSharedPool(e.target.checked)}
                  className="size-4 rounded text-primary"
                />
                <span>Enable group load-sharing (split freight with neighbors)</span>
              </label>

              {isSharedPool && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-muted-foreground text-[11px]">
                    Number of pooling farmers:
                  </span>
                  <select
                    value={poolPartnersCount}
                    onChange={(e) => setPoolPartnersCount(Number(e.target.value))}
                    className="h-8 rounded-lg border bg-background px-2 font-bold"
                  >
                    <option value={2}>2 Farmers (50% split)</option>
                    <option value={3}>3 Farmers (33% split)</option>
                    <option value={4}>4 Farmers (25% split)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Freight Comparison Card */}
          <div className="rounded-2xl bg-muted/40 p-4 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
              <span className="text-muted-foreground">
                Approx. Distance: <strong>{approxDistanceKm} km</strong> · Vehicle:{" "}
                <strong>{vehicle.name}</strong>
              </span>
              <span className="text-muted-foreground">
                Capacity Check:{" "}
                <strong>
                  {produceQtyQuintals}q of {vehicle.capacityQuintals}q capacity
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="rounded-xl border bg-card p-3">
                <span className="block text-[10px] text-muted-foreground">
                  Individual Solo Freight
                </span>
                <span className="text-base font-extrabold text-foreground">
                  {rupees(userEnteredOrEstSolo)}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  ₹{Math.round(userEnteredOrEstSolo / produceQtyQuintals)} / quintal
                </span>
              </div>

              {isSharedPool ? (
                <>
                  <div className="rounded-xl border bg-card p-3 border-emerald-500/60 bg-emerald-50/30 dark:bg-emerald-950/20">
                    <span className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      Shared Pool Cost Per Farmer
                    </span>
                    <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                      {rupees(sharedCostPerFarmer)}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      Split between {poolPartnersCount} farmers
                    </span>
                  </div>

                  <div className="rounded-xl border bg-card p-3 bg-emerald-500/10">
                    <span className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      Your Estimated Savings
                    </span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      +{rupees(estimatedSavings)} saved
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      Lower marketing deduction
                    </span>
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 flex items-center justify-center p-3 text-muted-foreground text-center">
                  Enable shared load-pooling above to calculate freight savings with neighbors.
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            <span>Record Transport Quotation / Pool Request</span>
          </button>
        </form>

        {/* Existing Transport Requests List */}
        {requests.length > 0 && (
          <section className="rounded-3xl border bg-card p-5 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <FileText className="size-4 text-primary" />
              Recorded Transport Requests & Quotes ({requests.length})
            </h3>

            <div className="space-y-2.5">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border bg-muted/20 p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-foreground">
                        {r.origin} → {r.destinationMandi}
                      </span>
                      <span className="rounded bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] font-bold">
                        #{r.id}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {r.vehicleType} · {r.produceQtyQ}q · Date: {r.preferredDate} · Contact:{" "}
                      {r.farmerPhone}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 text-[10px] font-bold capitalize">
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Page>
  );
}

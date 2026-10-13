import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import type { CandidateMarketRecord } from "@/lib/calc";
import { useSettings } from "@/lib/store";

export default function MandiMap({
  center,
  items,
  selected,
  onSelect,
}: {
  center: [number, number];
  items: CandidateMarketRecord[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useSettings();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const markets = useMemo(
    () => items.filter((item) => item.market.kind === "mandi"),
    [items],
  );
  const selectedMarket = markets.find((item) => item.market.id === selected);
  const selectedPlace = selectedMarket
    ? `${selectedMarket.market.names.en}, ${selectedMarket.market.district}, ${selectedMarket.market.state}`
    : `${center[0]},${center[1]}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace)}`;

  useEffect(() => {
    if (!container.current || mapRef.current) return;

    const map = L.map(container.current, { zoomControl: true }).setView(center, 8);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();
    L.marker(center, {
      icon: L.divIcon({
        className: "",
        html: '<div class="km-pin km-home">●</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
      title: t.location,
    }).addTo(markers);

    const bounds: L.LatLngExpression[] = [center];
    markets.forEach((item, index) => {
      const { market, status } = item;
      const point: [number, number] = [market.lat, market.lng];
      bounds.push(point);
      const symbol = status === "best" ? "✓" : status === "okay" ? "–" : "✕";
      const marker = L.marker(point, {
        icon: L.divIcon({
          className: "",
          html: `<div class="km-pin km-${status} ${selected === market.id ? "km-sel" : ""}">${index + 1}<small>${symbol}</small></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
        title: `${market.names.en}, ${market.district}`,
      });
      marker.on("click", () => onSelect(market.id));
      marker.addTo(markers);

      if (selected === market.id) {
        L.polyline([center, point], {
          color: "var(--color-primary)",
          weight: 4,
          dashArray: "8 6",
          className: "km-route",
        }).addTo(markers);
      }
    });

    if (selectedMarket) {
      map.setView([selectedMarket.market.lat, selectedMarket.market.lng], 10);
    } else if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [30, 30], maxZoom: 9 });
    } else {
      map.setView(center, 8);
    }
  }, [center, markets, selected, selectedMarket, onSelect, t.location]);

  return (
    <div className="space-y-3">
      <div
        ref={container}
        className="h-72 w-full overflow-hidden rounded-2xl border"
        role="application"
        aria-label={t.mapOfMandis}
      />
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label={t.mapOfMandis}>
        {markets.map((item, index) => (
          <button
            key={item.market.id}
            type="button"
            onClick={() => onSelect(item.market.id)}
            aria-pressed={selected === item.market.id}
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
              selected === item.market.id
                ? "border-primary bg-primary/10 text-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="font-bold">{index + 1}. {item.market.names.en}</span>
            <span>· {item.market.district}</span>
          </button>
        ))}
      </div>
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
      >
        {t.openInGoogleMaps}
      </a>
    </div>
  );
}

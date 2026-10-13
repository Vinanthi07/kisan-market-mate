import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import type { Ranked } from "@/lib/calc";

// Lazy-loaded (see sell route) so Leaflet stays out of the main bundle.
export default function MandiMap({
  center,
  items,
  selected,
  onSelect,
}: {
  center: [number, number];
  items: Ranked[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current) return;
    map.current = L.map(el.current, { zoomControl: true }).setView(center, 8);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 18,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current,
      g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    L.marker(center, {
      icon: L.divIcon({
        className: "",
        html: `<div class="km-pin km-home">●</div>`,
        iconSize: [28, 28],
      }),
    }).addTo(g);
    const pts: L.LatLngExpression[] = [center];
    items.forEach((r, i) => {
      if (r.market.kind !== "mandi") return;
      const ll: [number, number] = [r.market.lat, r.market.lng];
      pts.push(ll);
      const sym = r.status === "best" ? "✓" : r.status === "okay" ? "–" : "✕";
      const mk = L.marker(ll, {
        icon: L.divIcon({
          className: "",
          html: `<div class="km-pin km-${r.status} ${selected === r.market.id ? "km-sel" : ""}">${i + 1}<small>${sym}</small></div>`,
          iconSize: [40, 40],
        }),
      });
      mk.on("click", () => onSelect(r.market.id));
      mk.addTo(g);
      if (selected === r.market.id)
        L.polyline([center, ll], {
          color: "currentColor",
          weight: 5,
          dashArray: "8 6",
          className: "km-route",
        }).addTo(g);
    });
    if (pts.length > 1) m.fitBounds(L.latLngBounds(pts), { padding: [30, 30], maxZoom: 9 });
  }, [items, selected, center, onSelect]);

  return (
    <div
      ref={el}
      className="h-72 w-full overflow-hidden rounded-2xl border"
      role="application"
      aria-label="Map of mandis"
    />
  );
}

import { useEffect, useMemo, useRef } from "react";
import { LayersControl, MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { Reserve } from "../types";
import { reservePinIcon, reservePinIconSelected } from "../lib/icons";

interface Props {
  reserves: Reserve[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  userLocation: { lat: number; lng: number } | null;
}

/**
 * Map scale ramp: pins shrink at low zoom to reduce crowding, grow at high
 * zoom for easier targeting. Piecewise-linear between anchor points.
 */
function pinScaleForZoom(zoom: number): number {
  if (zoom <= 3) return 0.15;
  if (zoom <= 6) return 0.15 + (zoom - 3) * (0.15 / 3); //  3→0.15, 6→0.30
  if (zoom <= 9) return 0.3 + (zoom - 6) * (0.35 / 3); //   6→0.30, 9→0.65
  if (zoom <= 13) return 0.65 + (zoom - 9) * (0.45 / 4); // 9→0.65, 13→1.10
  return 1.1;
}

/**
 * On first mount, fit the map to all reserves. When the selected reserve
 * changes, pan/zoom to it. Continuously update the --pin-scale CSS variable
 * so pins shrink at low zoom.
 */
function MapBehavior({
  reserves,
  selectedSlug,
}: {
  reserves: Reserve[];
  selectedSlug: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (reserves.length === 0) return;
    const bounds = L.latLngBounds(reserves.map((r) => [r.lat, r.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, reserves]);

  useEffect(() => {
    if (!selectedSlug) return;
    const reserve = reserves.find((r) => r.slug === selectedSlug);
    if (!reserve) return;
    const target = L.latLng(reserve.lat, reserve.lng);
    const currentZoom = map.getZoom();
    map.flyTo(target, Math.max(currentZoom, 12), { duration: 0.6 });
  }, [map, reserves, selectedSlug]);

  useEffect(() => {
    const container = map.getContainer();
    const apply = () => {
      container.style.setProperty("--pin-scale", String(pinScaleForZoom(map.getZoom())));
    };
    apply();
    map.on("zoomend", apply);
    return () => {
      map.off("zoomend", apply);
    };
  }, [map]);

  return null;
}

export function MapView({ reserves, selectedSlug, onSelect, userLocation }: Props) {
  const center = useMemo<[number, number]>(() => [54.0, -1.5], []);

  // Defensive cleanup against Leaflet leaving tooltips open when mouseout
  // doesn't fire (happens when the cursor jumps quickly between overlapping
  // markers). On every mouseover, close any tooltips we've previously tracked
  // as open except the current one; on mouseout, drop from the tracked set.
  const openTooltips = useRef<Set<L.Marker>>(new Set());

  const handleMouseOver = (marker: L.Marker) => {
    for (const m of openTooltips.current) {
      if (m !== marker) m.closeTooltip();
    }
    openTooltips.current = new Set([marker]);
  };

  const handleMouseOut = (marker: L.Marker) => {
    openTooltips.current.delete(marker);
  };

  return (
    <MapContainer center={center} zoom={8} className="h-full w-full" zoomControl>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Topographic">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors, SRTM | Style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
            url="https://a.tile.opentopomap.org/{z}/{x}/{y}.png"
            maxZoom={17}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Street (OpenStreetMap)">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {reserves.map((r) => {
        const selected = r.slug === selectedSlug;
        return (
          <Marker
            key={r.id}
            position={[r.lat, r.lng]}
            icon={selected ? reservePinIconSelected : reservePinIcon}
            eventHandlers={{
              click: () => onSelect(r.slug),
              mouseover: (e) => handleMouseOver(e.target as L.Marker),
              mouseout: (e) => handleMouseOut(e.target as L.Marker),
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              {r.name}
            </Tooltip>
          </Marker>
        );
      })}

      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={L.divIcon({
            className: "",
            html: '<div style="background:#2563eb;border:3px solid #fff;border-radius:9999px;width:16px;height:16px;box-shadow:0 0 0 2px rgba(37,99,235,0.4);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })}
          title="You are here"
        />
      )}

      <MapBehavior reserves={reserves} selectedSlug={selectedSlug} />
    </MapContainer>
  );
}

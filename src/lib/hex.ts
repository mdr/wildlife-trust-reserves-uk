import { cellToBoundary, latLngToCell } from "h3-js";
import type { Reserve } from "../types";

export interface HexCell {
  id: string;
  count: number;
  /** Polygon boundary as [lat, lng] pairs, suitable for Leaflet. */
  boundary: [number, number][];
}

/**
 * Group reserves into H3 cells at the given resolution and return one entry
 * per non-empty cell with its count and Leaflet-ready polygon.
 *
 * Useful resolution choices for UK reserves (~2200 across Britain):
 *  5 — ~250 km² / ~9 km across, county-scale
 *  6 — ~36 km²  / ~3.7 km across, district-scale (default)
 *  7 — ~5 km²   / ~1.4 km across, neighbourhood-scale
 */
export function binReserves(reserves: Reserve[], resolution: number): HexCell[] {
  const counts = new Map<string, number>();
  for (const r of reserves) {
    const cell = latLngToCell(r.lat, r.lng, resolution);
    counts.set(cell, (counts.get(cell) ?? 0) + 1);
  }
  const cells: HexCell[] = [];
  for (const [id, count] of counts) {
    cells.push({ id, count, boundary: cellToBoundary(id) as [number, number][] });
  }
  return cells;
}

/**
 * 5-bucket YlOrRd-ish ramp for reserve counts per hex. Returns a fill colour;
 * stroke is a single darker shade applied to all cells.
 */
export function fillForCount(count: number): string {
  if (count >= 20) return "#7f1d1d"; // red-900
  if (count >= 10) return "#dc2626"; // red-600
  if (count >= 5) return "#f97316"; // orange-500
  if (count >= 2) return "#facc15"; // yellow-400
  return "#fde68a"; // amber-200
}

export const HEX_LEGEND: { label: string; color: string }[] = [
  { label: "1", color: "#fde68a" },
  { label: "2–4", color: "#facc15" },
  { label: "5–9", color: "#f97316" },
  { label: "10–19", color: "#dc2626" },
  { label: "20+", color: "#7f1d1d" },
];

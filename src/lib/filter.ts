import type { DogsPolicy, Reserve } from "../types";
import { haversineKm } from "./distance";

export type DogsFilter = "any" | DogsPolicy;

export interface FilterState {
  search: string;
  dogs: DogsFilter;
  parkingOnly: boolean;
  habitat: string; // "" = any
  trust: string; // "" = any
}

export type SortMode = "name" | "distance";

export interface FilterResult {
  reserve: Reserve;
  distanceKm: number | null;
}

export const EMPTY_FILTERS: FilterState = {
  search: "",
  dogs: "any",
  parkingOnly: false,
  habitat: "",
  trust: "",
};

const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");

export function matchesFilters(reserve: Reserve, filters: FilterState): boolean {
  if (filters.trust && reserve.trustName !== filters.trust) return false;
  if (filters.dogs !== "any" && reserve.dogs !== filters.dogs) return false;
  if (filters.parkingOnly && !reserve.parkingAvailable) return false;
  if (filters.habitat && !reserve.habitats.includes(filters.habitat)) return false;
  if (filters.search.trim()) {
    const q = norm(filters.search.trim());
    const haystack = norm(
      `${reserve.name} ${reserve.town} ${reserve.county} ${reserve.trustName}`,
    );
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export function applyFiltersAndSort(
  reserves: Reserve[],
  filters: FilterState,
  sort: SortMode,
  userLocation: { lat: number; lng: number } | null,
): FilterResult[] {
  const filtered = reserves.filter((r) => matchesFilters(r, filters));
  const withDistance: FilterResult[] = filtered.map((r) => ({
    reserve: r,
    distanceKm: userLocation ? haversineKm(userLocation, r) : null,
  }));

  if (sort === "distance" && userLocation) {
    withDistance.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  } else {
    withDistance.sort((a, b) => a.reserve.name.localeCompare(b.reserve.name));
  }
  return withDistance;
}

export function uniqueHabitats(reserves: Reserve[]): string[] {
  const set = new Set<string>();
  for (const r of reserves) for (const h of r.habitats) set.add(h);
  return [...set].sort();
}

export function uniqueTrusts(reserves: Reserve[]): string[] {
  const set = new Set<string>();
  for (const r of reserves) if (r.trustName) set.add(r.trustName);
  return [...set].sort();
}

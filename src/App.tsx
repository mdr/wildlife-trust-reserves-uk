import { useEffect, useMemo, useState } from "react";
import reservesJson from "./data/reserves.json";
import type { Reserve } from "./types";
import {
  applyFiltersAndSort,
  EMPTY_FILTERS,
  uniqueHabitats,
  uniqueTrusts,
  type SortMode,
} from "./lib/filter";
import { useReserveHashRoute } from "./hooks/useHashRoute";
import { useGeolocation } from "./hooks/useGeolocation";
import { MapView } from "./components/MapView";
import { Filters } from "./components/Filters";
import { ReserveList } from "./components/ReserveList";
import { ReserveDetail } from "./components/ReserveDetail";
import { MobileDrawer } from "./components/MobileDrawer";

const ALL_RESERVES = reservesJson as Reserve[];

type DrawerSnap = "peek" | "half" | "full";

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

export function App() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortMode>("name");
  const geo = useGeolocation();
  const { slug, open, close } = useReserveHashRoute();
  const isMobile = useIsMobile();
  const [drawerSnap, setDrawerSnap] = useState<DrawerSnap>("half");

  const habitats = useMemo(() => uniqueHabitats(ALL_RESERVES), []);
  const trusts = useMemo(() => uniqueTrusts(ALL_RESERVES), []);

  const results = useMemo(
    () => applyFiltersAndSort(ALL_RESERVES, filters, sort, geo.coords),
    [filters, sort, geo.coords],
  );

  const selectedReserve = useMemo(
    () => (slug ? ALL_RESERVES.find((r) => r.slug === slug) ?? null : null),
    [slug],
  );

  // Snap drawer open when a reserve is selected, peek when deselected.
  useEffect(() => {
    if (!isMobile) return;
    setDrawerSnap(slug ? "full" : "peek");
  }, [slug, isMobile]);

  const onSelect = (s: string) => {
    open(s);
    if (isMobile) setDrawerSnap("full");
  };
  const onBack = () => {
    close();
    if (isMobile) setDrawerSnap("half");
  };

  const sidebarContent = selectedReserve ? (
    <ReserveDetail reserve={selectedReserve} onBack={onBack} />
  ) : (
    <>
      <Filters
        filters={filters}
        setFilters={setFilters}
        habitats={habitats}
        trusts={trusts}
        sort={sort}
        setSort={setSort}
        geoStatus={geo.status}
        onUseLocation={geo.request}
        onClearLocation={() => {
          geo.clear();
          setSort("name");
        }}
      />
      <div className="px-3 py-2 text-xs text-slate-500">
        {results.length} of {ALL_RESERVES.length} reserves
      </div>
      <div className="min-h-0 flex-1">
        <ReserveList
          results={results}
          selectedSlug={slug}
          onSelect={onSelect}
          showDistance={sort === "distance" && geo.coords !== null}
          showTrust={!filters.trust}
        />
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <div className="absolute inset-0">
          <MapView
            reserves={ALL_RESERVES}
            selectedSlug={slug}
            onSelect={onSelect}
            userLocation={geo.coords}
          />
        </div>
        <MobileDrawer snap={drawerSnap} onSnapChange={setDrawerSnap}>
          {sidebarContent}
        </MobileDrawer>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      <aside className="flex h-full w-[380px] shrink-0 flex-col border-r border-slate-200 bg-white">
        {sidebarContent}
      </aside>
      <main className="h-full flex-1">
        <MapView
          reserves={ALL_RESERVES}
          selectedSlug={slug}
          onSelect={onSelect}
          userLocation={geo.coords}
        />
      </main>
    </div>
  );
}

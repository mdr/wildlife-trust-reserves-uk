import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { FilterResult } from "../lib/filter";
import type { DogsPolicy, Reserve } from "../types";

interface Props {
  results: FilterResult[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  showDistance: boolean;
  showTrust: boolean;
}

const DOGS_LABEL: Record<DogsPolicy, string> = {
  permitted: "Dogs OK",
  on_lead: "Dogs on lead",
  restricted: "Dogs restricted",
  not_permitted: "No dogs",
  unknown: "",
};

function FacilityChips({ reserve }: { reserve: Reserve }) {
  const f = reserve.facilities;
  return (
    <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-slate-600">
      {reserve.parkingAvailable && (
        <span className="rounded bg-slate-200 px-1.5 py-0.5">Parking</span>
      )}
      {f.toilets && <span className="rounded bg-slate-200 px-1.5 py-0.5">Toilets</span>}
      {f.cafeRefreshments && <span className="rounded bg-slate-200 px-1.5 py-0.5">Café</span>}
      {f.birdHides && <span className="rounded bg-slate-200 px-1.5 py-0.5">Bird hides</span>}
      {f.visitorCentre && (
        <span className="rounded bg-slate-200 px-1.5 py-0.5">Visitor centre</span>
      )}
      {f.accessibleTrails && (
        <span className="rounded bg-slate-200 px-1.5 py-0.5">Accessible</span>
      )}
      {reserve.dogs === "permitted" && (
        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">
          {DOGS_LABEL.permitted}
        </span>
      )}
      {reserve.dogs === "on_lead" && (
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
          {DOGS_LABEL.on_lead}
        </span>
      )}
      {reserve.dogs === "not_permitted" && (
        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-800">
          {DOGS_LABEL.not_permitted}
        </span>
      )}
      {reserve.dogs === "restricted" && (
        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-800">
          {DOGS_LABEL.restricted}
        </span>
      )}
    </div>
  );
}

export function ReserveList({ results, selectedSlug, onSelect, showDistance, showTrust }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88,
    overscan: 8,
  });

  if (results.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        No reserves match these filters.
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-y-auto">
      <div
        style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = results[virtualRow.index]!;
          const { reserve, distanceKm } = item;
          const isSelected = reserve.slug === selectedSlug;
          return (
            <div
              key={reserve.id}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="border-b border-slate-200"
            >
              <button
                onClick={() => onSelect(reserve.slug)}
                className={
                  "block w-full px-3 py-2.5 text-left hover:bg-slate-100 " +
                  (isSelected ? "bg-emerald-50" : "")
                }
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-slate-900">{reserve.name}</span>
                  {showDistance && distanceKm !== null && (
                    <span className="shrink-0 text-xs text-slate-500">
                      {distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km
                    </span>
                  )}
                </div>
                {(reserve.town || reserve.county) && (
                  <div className="text-xs text-slate-500">
                    {reserve.town}
                    {reserve.county && reserve.town ? `, ${reserve.county}` : reserve.county}
                  </div>
                )}
                {showTrust && (
                  <div className="text-[11px] text-slate-400">{reserve.trustName}</div>
                )}
                <FacilityChips reserve={reserve} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

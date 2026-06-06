import type { FilterState, SortMode } from "../lib/filter";

interface Props {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  habitats: string[];
  trusts: string[];
  sort: SortMode;
  setSort: (s: SortMode) => void;
  geoStatus: "idle" | "requesting" | "ok" | "denied" | "error";
  onUseLocation: () => void;
  onClearLocation: () => void;
}

export function Filters({
  filters,
  setFilters,
  habitats,
  trusts,
  sort,
  setSort,
  geoStatus,
  onUseLocation,
  onClearLocation,
}: Props) {
  return (
    <div className="space-y-2 border-b border-slate-200 bg-slate-50 p-3">
      <input
        type="search"
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        placeholder="Search by name or town..."
        className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-emerald-600 focus:outline-none"
      />
      <select
        value={filters.trust}
        onChange={(e) => setFilters({ ...filters, trust: e.target.value })}
        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm"
        title="Trust"
      >
        <option value="">All trusts ({trusts.length})</option>
        {trusts.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap gap-2 text-sm">
        <select
          value={filters.dogs}
          onChange={(e) =>
            setFilters({ ...filters, dogs: e.target.value as FilterState["dogs"] })
          }
          className="rounded border border-slate-300 bg-white px-2 py-1"
          title="Dogs policy"
        >
          <option value="any">Dogs: any</option>
          <option value="permitted">Dogs: permitted</option>
          <option value="on_lead">Dogs: on lead</option>
          <option value="restricted">Dogs: restricted</option>
          <option value="not_permitted">Dogs: not permitted</option>
          <option value="unknown">Dogs: unknown</option>
        </select>

        <select
          value={filters.habitat}
          onChange={(e) => setFilters({ ...filters, habitat: e.target.value })}
          className="rounded border border-slate-300 bg-white px-2 py-1"
          title="Habitat"
        >
          <option value="">Habitat: any</option>
          {habitats.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 rounded border border-slate-300 bg-white px-2 py-1">
          <input
            type="checkbox"
            checked={filters.parkingOnly}
            onChange={(e) => setFilters({ ...filters, parkingOnly: e.target.checked })}
          />
          Parking
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="rounded border border-slate-300 bg-white px-2 py-1"
          title="Sort"
        >
          <option value="name">Sort: name</option>
          <option value="distance" disabled={geoStatus !== "ok"}>
            Sort: distance from me
          </option>
        </select>

        {geoStatus === "ok" ? (
          <button
            onClick={onClearLocation}
            className="rounded border border-emerald-600 bg-emerald-50 px-2 py-1 text-emerald-800 hover:bg-emerald-100"
            title="Stop using my location"
          >
            ✓ Using my location
          </button>
        ) : (
          <button
            onClick={onUseLocation}
            disabled={geoStatus === "requesting"}
            className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100 disabled:opacity-50"
          >
            {geoStatus === "requesting"
              ? "Locating…"
              : geoStatus === "denied"
                ? "Location denied"
                : geoStatus === "error"
                  ? "Try location again"
                  : "Use my location"}
          </button>
        )}
      </div>
    </div>
  );
}

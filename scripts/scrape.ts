#!/usr/bin/env tsx
/**
 * Scrape Yorkshire Wildlife Trust's open JSON:API for nature reserves and
 * emit a clean reserves.json the React app can import.
 *
 * Run: pnpm run scrape
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { DogsPolicy, Facilities, Reserve } from "../src/types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data/reserves.json");
// The Wildlife Trusts run a federated Drupal CMS — wildlifetrusts.org
// aggregates reserves from all 46 UK trusts on the same JSON:API path.
const BASE = "https://www.wildlifetrusts.org";
const FIRST =
  BASE +
  "/jsonapi/node/reserve" +
  "?page[limit]=50" +
  "&include=field_reserve_habitat,field_reserve_great_for";
const HABITAT_CONCURRENCY = 12;

interface JsonApiResource {
  type: string;
  id: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, { data: { type: string; id: string }[] | { type: string; id: string } | null }>;
}
interface JsonApiPage {
  data: JsonApiResource[];
  included?: JsonApiResource[];
  links?: { next?: { href: string } };
  meta?: { count?: number };
}

async function fetchAllReserves(): Promise<{
  reserves: JsonApiResource[];
  byId: Map<string, JsonApiResource>;
  total: number | undefined;
}> {
  const reserves: JsonApiResource[] = [];
  const byId = new Map<string, JsonApiResource>();
  let url: string | undefined = FIRST;
  let total: number | undefined;
  while (url) {
    process.stdout.write(`fetching ${url} ... `);
    const res = await fetch(url, { headers: { Accept: "application/vnd.api+json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const page = (await res.json()) as JsonApiPage;
    if (page.meta?.count !== undefined) total = page.meta.count;
    reserves.push(...page.data);
    for (const r of page.data) byId.set(`${r.type}:${r.id}`, r);
    for (const r of page.included ?? []) byId.set(`${r.type}:${r.id}`, r);
    process.stdout.write(`+${page.data.length}\n`);
    url = page.links?.next?.href;
  }
  return { reserves, byId, total };
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function bool(v: unknown): boolean {
  return v === true;
}

function dogsPolicy(raw: string): DogsPolicy {
  // YWT stores dogs policy as an enum machine name.
  switch (raw.trim()) {
    case "permitted":
      return "permitted";
    case "on_a_lead":
      return "on_lead";
    case "under_effective_control":
      // Permitted but with a constraint — closer to on_lead than free permitted.
      return "on_lead";
    case "guide_dogs_only":
    case "assistance_dogs_only":
      return "restricted";
    case "not_permitted":
    case "no_dogs":
      return "not_permitted";
    case "":
      return "unknown";
    default:
      return "unknown";
  }
}

function parkingAvailable(info: string): boolean {
  const s = info.toLowerCase();
  if (!s.trim()) return false;
  if (s.includes("no parking") || s.includes("no public parking")) return false;
  return true;
}

interface MetatagEntry {
  tag?: string;
  attributes?: Record<string, string>;
}

function extractHeroImage(metatag: unknown): string | null {
  if (!Array.isArray(metatag)) return null;
  for (const entry of metatag as MetatagEntry[]) {
    if (entry?.attributes?.rel === "image_src" && entry.attributes.href) {
      return entry.attributes.href;
    }
  }
  for (const entry of metatag as MetatagEntry[]) {
    const a = entry?.attributes;
    if (a?.property === "og:image" && a.content) return a.content;
    if (a?.name === "twitter:image" && a.content) return a.content;
  }
  return null;
}

function lookupNames(
  rel: JsonApiResource["relationships"] | undefined,
  field: string,
  byId: Map<string, JsonApiResource>,
): string[] {
  const data = rel?.[field]?.data;
  if (!data || !Array.isArray(data)) return [];
  const names: string[] = [];
  for (const ref of data) {
    const node = byId.get(`${ref.type}:${ref.id}`);
    const attrs = node?.attributes;
    const name =
      (typeof attrs?.name === "string" && attrs.name) ||
      (typeof attrs?.title === "string" && attrs.title) ||
      null;
    if (name) names.push(name);
  }
  return names;
}

/**
 * Drupal's JSON:API hides node-reference fields like field_reserve_habitat in
 * list responses (returns data: []) but exposes them on individual node
 * endpoints. So we fetch habitats per-reserve via the related endpoint.
 */
async function fetchHabitats(uuid: string): Promise<string[]> {
  const url = `${BASE}/jsonapi/node/reserve/${uuid}/field_reserve_habitat`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.api+json" } });
  if (!res.ok) {
    console.warn(`  habitat fetch ${uuid}: HTTP ${res.status}`);
    return [];
  }
  const page = (await res.json()) as { data?: JsonApiResource[] };
  const habs: string[] = [];
  for (const node of page.data ?? []) {
    const title = node.attributes?.title;
    if (typeof title === "string") habs.push(title);
  }
  return habs;
}

function transform(r: JsonApiResource, byId: Map<string, JsonApiResource>): Reserve | null {
  const a = r.attributes ?? {};
  const latLong = a.field_reserve_lat_long as
    | { lat?: number; lon?: number }
    | undefined
    | null;
  if (!latLong || typeof latLong.lat !== "number" || typeof latLong.lon !== "number") {
    console.warn(`skipping ${r.id}: no lat/lng`);
    return null;
  }
  const path = a.path as { alias?: string } | undefined;
  const slug = path?.alias ? path.alias.replace(/^\/nature-reserves\//, "") : r.id;
  // Prefer the originating trust's canonical URL when present, otherwise
  // fall back to the federated wildlifetrusts.org alias.
  const deepLink = a.field_reserve_deep_link as { uri?: string } | undefined | null;
  const canonicalUrl =
    (deepLink?.uri && deepLink.uri.startsWith("http") ? deepLink.uri : null) ??
    (path?.alias ? `${BASE}${path.alias}` : `${BASE}/node/${a.drupal_internal__nid}`);
  const trustName =
    typeof a.trust_name === "string" ? a.trust_name : "Unknown trust";
  const trustId = typeof a.trust_id === "string" ? a.trust_id : null;
  const about = a.field_reserve_about as { processed?: string; value?: string } | null | undefined;
  const walkingTrails = a.field_reserve_walking_trails as
    | { processed?: string; value?: string }
    | null
    | undefined;
  const access = a.field_reserve_access as
    | { processed?: string; value?: string }
    | null
    | undefined;
  const dogsRaw = str(a.field_reserve_dogs);
  const parkingInfo = str(a.field_reserve_parking_info);

  const facilities: Facilities = {
    toilets: bool(a.field_reserve_toilets),
    disabledToilet: bool(a.field_reserve_disabled_toilet),
    birdHides: bool(a.field_reserve_bird_hides),
    cafeRefreshments: bool(a.field_reserve_cafe_refreshments),
    visitorCentre: bool(a.field_reserve_visitor_centre),
    shop: bool(a.field_reserve_shop),
    wifi: bool(a.field_reserve_wifi),
    babyChanging: bool(a.field_reserve_baby_changing),
    bicycleParking: bool(a.field_reserve_bicycle_parking),
    picnicArea: bool(a.field_reserve_picnic_area),
    outdoorPlayArea: bool(a.field_reserve_outdoor_play_area),
    carCharging: bool(a.field_reserve_car_charging),
    disabledParking: bool(a.field_reserve_disabled_parking),
    accessibleTrails: bool(a.field_reserve_accessible_trails),
  };

  return {
    id: r.id,
    nid: typeof a.drupal_internal__nid === "number" ? a.drupal_internal__nid : -1,
    slug,
    canonicalUrl,
    trustId,
    trustName,
    name: str(a.title, "(unnamed)"),
    lat: latLong.lat,
    lng: latLong.lon,
    summary: str(a.field_reserve_summary).trim(),
    about: str(about?.processed ?? about?.value ?? ""),
    address: str(a.field_reserve_address).trim(),
    town: str(a.field_reserve_town)
      .replace(/^Nearest town:\s*/i, "")
      .trim(),
    county: str(a.field_reserve_county).trim(),
    postcode: str(a.field_reserve_postcode).trim(),
    osMapRef: str(a.field_reserve_map_ref).trim(),
    what3words: str(a.field_reserve_what3words).trim(),
    sizeHectares: num(a.field_reserve_size),
    entryFee: str(a.field_reserve_entry_fee).trim(),
    openingTimes: str(a.field_reserve_opening_times).trim(),
    bestTimeToVisit: str(a.field_reserve_best_time_to_visit).trim(),
    parkingInfo,
    parkingAvailable: parkingAvailable(parkingInfo),
    walkingTrails: str(walkingTrails?.processed ?? walkingTrails?.value ?? ""),
    access: str(access?.processed ?? access?.value ?? ""),
    dogs: dogsPolicy(dogsRaw),
    dogsRaw,
    habitats: lookupNames(r.relationships, "field_reserve_habitat", byId),
    greatFor: lookupNames(r.relationships, "field_reserve_great_for", byId),
    heroImage: extractHeroImage(a.metatag),
    facilities,
  };
}

async function main() {
  console.log("YWT JSON:API scraper");
  const { reserves: raw, byId, total } = await fetchAllReserves();
  console.log(`fetched ${raw.length} reserves (meta.count=${total})`);
  const cleaned = raw
    .map((r) => transform(r, byId))
    .filter((r): r is Reserve => r !== null);

  console.log(
    `fetching habitats for ${cleaned.length} reserves (${HABITAT_CONCURRENCY} in parallel)...`,
  );
  let done = 0;
  const queue = [...cleaned];
  const workers = Array.from({ length: HABITAT_CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const reserve = queue.shift();
      if (!reserve) return;
      try {
        reserve.habitats = await fetchHabitats(reserve.id);
      } catch (err) {
        console.warn(`  habitat fetch failed for ${reserve.id}: ${(err as Error).message}`);
        reserve.habitats = [];
      }
      done++;
      if (done % 50 === 0 || done === cleaned.length) {
        process.stdout.write(`  ${done}/${cleaned.length}\r`);
      }
    }
  });
  await Promise.all(workers);
  process.stdout.write("\n");

  cleaned.sort((a, b) => a.name.localeCompare(b.name));
  console.log(`emitting ${cleaned.length} cleaned reserves`);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(cleaned, null, 2) + "\n");
  console.log(`wrote ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

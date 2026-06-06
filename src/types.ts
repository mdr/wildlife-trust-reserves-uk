export type DogsPolicy =
  | "permitted"
  | "on_lead"
  | "not_permitted"
  | "restricted"
  | "unknown";

export interface Facilities {
  toilets: boolean;
  disabledToilet: boolean;
  birdHides: boolean;
  cafeRefreshments: boolean;
  visitorCentre: boolean;
  shop: boolean;
  wifi: boolean;
  babyChanging: boolean;
  bicycleParking: boolean;
  picnicArea: boolean;
  outdoorPlayArea: boolean;
  carCharging: boolean;
  disabledParking: boolean;
  accessibleTrails: boolean;
}

export interface Reserve {
  id: string;
  nid: number;
  slug: string;
  canonicalUrl: string;
  trustId: string | null;
  trustName: string;
  name: string;
  lat: number;
  lng: number;
  summary: string;
  about: string;
  address: string;
  town: string;
  county: string;
  postcode: string;
  osMapRef: string;
  what3words: string;
  sizeHectares: number | null;
  entryFee: string;
  openingTimes: string;
  bestTimeToVisit: string;
  parkingInfo: string;
  parkingAvailable: boolean;
  walkingTrails: string;
  access: string;
  dogs: DogsPolicy;
  dogsRaw: string;
  habitats: string[];
  greatFor: string[];
  heroImage: string | null;
  facilities: Facilities;
}

export type ReserveSummary = Pick<
  Reserve,
  | "id"
  | "slug"
  | "name"
  | "lat"
  | "lng"
  | "town"
  | "county"
  | "dogs"
  | "parkingAvailable"
  | "habitats"
  | "facilities"
>;

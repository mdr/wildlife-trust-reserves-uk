import type { DogsPolicy, Reserve } from "../types";

interface Props {
  reserve: Reserve;
  onBack: () => void;
}

const DOGS_DESCRIPTION: Record<DogsPolicy, string> = {
  permitted: "Dogs permitted",
  on_lead: "Dogs on lead",
  restricted: "Dogs restricted (e.g. assistance dogs only)",
  not_permitted: "No dogs permitted",
  unknown: "Dogs: not specified",
};

function FactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1.5 text-sm">
      <dt className="w-28 shrink-0 text-slate-500">{label}</dt>
      <dd className="flex-1 text-slate-900">{children}</dd>
    </div>
  );
}

function FacilityList({ reserve }: { reserve: Reserve }) {
  const f = reserve.facilities;
  const items: { label: string; on: boolean }[] = [
    { label: "Parking", on: reserve.parkingAvailable },
    { label: "Disabled parking", on: f.disabledParking },
    { label: "Toilets", on: f.toilets },
    { label: "Disabled toilet", on: f.disabledToilet },
    { label: "Café / refreshments", on: f.cafeRefreshments },
    { label: "Visitor centre", on: f.visitorCentre },
    { label: "Bird hides", on: f.birdHides },
    { label: "Accessible trails", on: f.accessibleTrails },
    { label: "Picnic area", on: f.picnicArea },
    { label: "Shop", on: f.shop },
    { label: "Baby changing", on: f.babyChanging },
    { label: "Outdoor play area", on: f.outdoorPlayArea },
    { label: "Bicycle parking", on: f.bicycleParking },
    { label: "Car charging", on: f.carCharging },
    { label: "WiFi", on: f.wifi },
  ];
  const present = items.filter((i) => i.on);
  if (present.length === 0) {
    return <p className="text-sm text-slate-500">No facilities listed.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-y-0.5 text-sm">
      {present.map((i) => (
        <li key={i.label} className="text-slate-700">
          ✓ {i.label}
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-200 px-4 py-3">
      <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ReserveDetail({ reserve, onBack }: Props) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <button
          onClick={onBack}
          className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100"
        >
          ← Back to list
        </button>
      </div>

      {reserve.heroImage && (
        <img
          src={reserve.heroImage}
          alt={reserve.name}
          className="aspect-[16/10] w-full object-cover"
          loading="lazy"
        />
      )}

      <div className="px-4 pt-3 pb-2">
        <h2 className="text-lg leading-tight font-semibold text-slate-900">{reserve.name}</h2>
        <p className="text-xs text-slate-400">{reserve.trustName}</p>
        {(reserve.town || reserve.county) && (
          <p className="text-sm text-slate-500">
            {reserve.town}
            {reserve.county && reserve.town ? `, ${reserve.county}` : reserve.county}
          </p>
        )}
        {reserve.summary && (
          <p className="mt-2 text-sm text-slate-700">{reserve.summary}</p>
        )}
      </div>

      <Section title="Key facts">
        <dl>
          {reserve.address && <FactRow label="Address">{reserve.address}</FactRow>}
          {reserve.postcode && <FactRow label="Postcode">{reserve.postcode}</FactRow>}
          {reserve.sizeHectares !== null && (
            <FactRow label="Size">{reserve.sizeHectares} hectares</FactRow>
          )}
          {reserve.entryFee && <FactRow label="Entry fee">{reserve.entryFee}</FactRow>}
          {reserve.osMapRef && <FactRow label="OS grid ref">{reserve.osMapRef}</FactRow>}
          {reserve.what3words && (
            <FactRow label="what3words">
              <a
                href={`https://w3w.co/${reserve.what3words}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 underline"
              >
                ///{reserve.what3words}
              </a>
            </FactRow>
          )}
          <FactRow label="Dogs">{DOGS_DESCRIPTION[reserve.dogs]}</FactRow>
          {reserve.habitats.length > 0 && (
            <FactRow label="Habitats">{reserve.habitats.join(", ")}</FactRow>
          )}
          {reserve.greatFor.length > 0 && (
            <FactRow label="Great for">{reserve.greatFor.join(", ")}</FactRow>
          )}
          {reserve.bestTimeToVisit && (
            <FactRow label="Best time">{reserve.bestTimeToVisit}</FactRow>
          )}
        </dl>
      </Section>

      <Section title="Facilities">
        <FacilityList reserve={reserve} />
      </Section>

      {reserve.parkingInfo && (
        <Section title="Parking">
          <p className="text-sm text-slate-700 whitespace-pre-line">{reserve.parkingInfo}</p>
        </Section>
      )}

      {reserve.access && (
        <Section title="Access">
          <div
            className="prose prose-sm max-w-none text-sm text-slate-700"
            dangerouslySetInnerHTML={{ __html: reserve.access }}
          />
        </Section>
      )}

      {reserve.walkingTrails && (
        <Section title="Walking trails">
          <div
            className="prose prose-sm max-w-none text-sm text-slate-700"
            dangerouslySetInnerHTML={{ __html: reserve.walkingTrails }}
          />
        </Section>
      )}

      {reserve.openingTimes && (
        <Section title="Opening times">
          <p className="text-sm text-slate-700">{reserve.openingTimes}</p>
        </Section>
      )}

      {reserve.about && (
        <Section title="About">
          <div
            className="prose prose-sm max-w-none text-sm text-slate-700"
            dangerouslySetInnerHTML={{ __html: reserve.about }}
          />
        </Section>
      )}

      <Section title="Links">
        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href={reserve.canonicalUrl}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-700 underline"
          >
            View on trust website →
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${reserve.lat},${reserve.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-700 underline"
          >
            Directions →
          </a>
        </div>
      </Section>
    </div>
  );
}

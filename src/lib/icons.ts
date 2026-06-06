import L from "leaflet";

const buildDivIcon = (selected: boolean): L.DivIcon =>
  L.divIcon({
    className: "",
    html: `<div class="${selected ? "reserve-pin reserve-pin--selected" : "reserve-pin"}"></div>`,
    iconSize: selected ? [24, 24] : [16, 16],
    iconAnchor: selected ? [12, 12] : [8, 8],
  });

export const reservePinIcon = buildDivIcon(false);
export const reservePinIconSelected = buildDivIcon(true);

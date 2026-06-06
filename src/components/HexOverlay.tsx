import { useMemo } from "react";
import { Polygon } from "react-leaflet";
import { binReserves, fillForCount } from "../lib/hex";
import type { Reserve } from "../types";

interface Props {
  reserves: Reserve[];
  resolution: number;
}

export function HexOverlay({ reserves, resolution }: Props) {
  const cells = useMemo(() => binReserves(reserves, resolution), [reserves, resolution]);
  return (
    <>
      {cells.map((cell) => (
        <Polygon
          key={cell.id}
          positions={cell.boundary}
          pathOptions={{
            fillColor: fillForCount(cell.count),
            fillOpacity: 0.55,
            color: "#1f2937",
            weight: 0.5,
            opacity: 0.5,
          }}
        />
      ))}
    </>
  );
}

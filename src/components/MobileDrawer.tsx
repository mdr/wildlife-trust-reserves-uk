import { useRef, useState } from "react";

type Snap = "peek" | "half" | "full";

const HEIGHTS: Record<Snap, number> = {
  peek: 12,
  half: 55,
  full: 92,
};

interface Props {
  children: React.ReactNode;
  snap: Snap;
  onSnapChange: (snap: Snap) => void;
}

/**
 * Bottom drawer with three snap points. Drag the handle to resize; on release
 * the height snaps to the closest of peek/half/full. Tap the handle to cycle
 * through the snap points.
 */
export function MobileDrawer({ children, snap, onSnapChange }: Props) {
  const startY = useRef<number | null>(null);
  const startVh = useRef<number>(0);
  const [dragVh, setDragVh] = useState<number | null>(null);
  const dragged = useRef(false);

  const closestSnap = (vh: number): Snap => {
    const candidates: Snap[] = ["peek", "half", "full"];
    let best: Snap = "peek";
    let bestDist = Infinity;
    for (const s of candidates) {
      const d = Math.abs(HEIGHTS[s] - vh);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    return best;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    startVh.current = HEIGHTS[snap];
    dragged.current = false;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    const dyPx = startY.current - e.clientY;
    const dyVh = (dyPx / window.innerHeight) * 100;
    if (Math.abs(dyVh) > 1) dragged.current = true;
    setDragVh(Math.min(92, Math.max(12, startVh.current + dyVh)));
  };
  const onPointerUp = () => {
    if (dragVh !== null && dragged.current) {
      onSnapChange(closestSnap(dragVh));
    } else if (!dragged.current) {
      const cycle: Snap[] = ["peek", "half", "full"];
      const idx = cycle.indexOf(snap);
      onSnapChange(cycle[(idx + 1) % cycle.length]!);
    }
    startY.current = null;
    setDragVh(null);
  };

  const heightVh = dragVh !== null ? dragVh : HEIGHTS[snap];

  return (
    <div
      className="absolute right-0 bottom-0 left-0 z-1000 flex flex-col rounded-t-xl border-t border-slate-200 bg-white shadow-2xl"
      style={{
        height: `${heightVh}vh`,
        transition: dragVh !== null ? "none" : "height 200ms ease-out",
      }}
    >
      <div
        className="flex shrink-0 cursor-grab touch-none justify-center py-2 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="h-1 w-10 rounded-full bg-slate-300" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

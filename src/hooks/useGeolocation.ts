import { useCallback, useState } from "react";

export interface GeolocationState {
  coords: { lat: number; lng: number } | null;
  status: "idle" | "requesting" | "ok" | "denied" | "error";
  error: string | null;
}

export function useGeolocation(): GeolocationState & { request: () => void; clear: () => void } {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    status: "idle",
    error: null,
  });

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({ coords: null, status: "error", error: "Geolocation unsupported" });
      return;
    }
    setState((s) => ({ ...s, status: "requesting", error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          status: "ok",
          error: null,
        });
      },
      (err) => {
        setState({
          coords: null,
          status: err.code === err.PERMISSION_DENIED ? "denied" : "error",
          error: err.message,
        });
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }, []);

  const clear = useCallback(() => {
    setState({ coords: null, status: "idle", error: null });
  }, []);

  return { ...state, request, clear };
}

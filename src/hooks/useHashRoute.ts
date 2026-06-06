import { useEffect, useState } from "react";

const RESERVE_HASH = /^#\/r\/(.+)$/;

function readSlug(): string | null {
  const m = window.location.hash.match(RESERVE_HASH);
  return m ? decodeURIComponent(m[1]!) : null;
}

export function useReserveHashRoute(): {
  slug: string | null;
  open: (slug: string) => void;
  close: () => void;
} {
  const [slug, setSlug] = useState<string | null>(() => readSlug());

  useEffect(() => {
    const onHashChange = () => setSlug(readSlug());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return {
    slug,
    open: (s) => {
      window.location.hash = `#/r/${encodeURIComponent(s)}`;
    },
    close: () => {
      // Clearing hash without reloading; pushState avoids leaving an empty `#`.
      history.replaceState(null, "", window.location.pathname + window.location.search);
      setSlug(null);
    },
  };
}

import { useEffect, useState } from "react";

const read = () => window.location.hash.replace("#", "");

/** The current `location.hash` without the `#`, kept in sync. */
export function useHashRoute() {
  const [hash, setHash] = useState(read);
  useEffect(() => {
    const onChange = () => setHash(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export const go = (to: string) => {
  window.location.hash = to;
};

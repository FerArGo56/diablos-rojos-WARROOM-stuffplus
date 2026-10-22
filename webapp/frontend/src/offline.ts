import { useEffect, useState } from "react";

// ¿Lo último que se mostró vino de la caché del service worker (sin conexión)? y ¿de cuándo es?
type Offline = { fromCache: boolean; dataAt: number | null };
let state: Offline = { fromCache: false, dataAt: null };
const listeners = new Set<(s: Offline) => void>();

/** El service worker marca con x-from-cache las respuestas guardadas; `date` dice cuándo las mandó el servidor. */
export function noteResponse(res: Response) {
  const fromCache = res.headers.get("x-from-cache") === "1";
  const date = Date.parse(res.headers.get("date") ?? "");
  const next: Offline = fromCache
    ? { fromCache: true, dataAt: Number.isNaN(date) ? state.dataAt : Math.min(date, state.dataAt ?? date) }
    : { fromCache: false, dataAt: null };
  if (next.fromCache === state.fromCache && next.dataAt === state.dataAt) return;
  state = next;
  listeners.forEach((l) => l(state));
}

export function useOffline(): Offline {
  const [s, setS] = useState(state);
  useEffect(() => { listeners.add(setS); return () => { listeners.delete(setS); }; }, []);
  return s;
}

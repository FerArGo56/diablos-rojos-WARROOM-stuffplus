import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type Meta } from "./api";
import { VERDICT_COLOR, scaleFrom, verdictFor, type ParkScale } from "./verdicts";

export const PITCH_COLORS: Record<string, string> = {
  "Four-Seam": "#ff4d5e", Sinker: "#ff9f43", Cutter: "#c08a6a", Slider: "#ffd23f",
  Curveball: "#45c4f0", Changeup: "#2fd39a", Splitter: "#b58cff",
};

/** Sea level -> high altitude, cool to hot. */
export function altitudeColor(alt: number): string {
  const stops: [number, [number, number, number]][] = [
    [0, [69, 196, 240]], [800, [120, 200, 160]], [1500, [255, 196, 64]], [2250, [230, 30, 50]],
  ];
  let i = 0;
  while (i < stops.length - 2 && alt > stops[i + 1][0]) i++;
  const [a0, c0] = stops[i];
  const [a1, c1] = stops[i + 1];
  const f = Math.max(0, Math.min(1, (alt - a0) / (a1 - a0)));
  const c = c0.map((v, j) => Math.round(v + f * (c1[j] - v)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** Color de un Stuff+ suelto, con la misma escala del parque que el veredicto (src/verdicts.ts). */
export function stuffColor(v: number | null | undefined, scale: ParkScale | null | undefined): string {
  const k = verdictFor(v, scale);
  return k ? VERDICT_COLOR[k] : "var(--muted)";
}

// Una sola llamada al ranking por parque, compartida por todas las pantallas.
const scaleCache = new Map<string, Promise<ParkScale | null>>();
type Board = { rows: { stuff_plus: number }[] };

/** Escala de veredictos del parque: percentiles del Stuff+ de toda la liga proyectada ahí
 *  (o solo de un rol, para comparar abridores contra abridores y relevistas contra relevistas). */
export function useParkScale(stadiumId: string | null | undefined, role?: "SP" | "RP"): ParkScale | null {
  const [scale, setScale] = useState<ParkScale | null>(null);
  useEffect(() => {
    if (!stadiumId) { setScale(null); return; }
    let alive = true;
    const key = `${stadiumId}|${role ?? ""}`;
    let p = scaleCache.get(key);
    if (!p) {
      p = api<Board>(`/stadiums/${stadiumId}/leaderboard`, { limit: 500, role }).then((b) => scaleFrom(b.rows.map((r) => r.stuff_plus)));
      p.catch(() => scaleCache.delete(key));
      scaleCache.set(key, p);
    }
    p.then((s) => { if (alive) setScale(s); }).catch(() => { if (alive) setScale(null); });
    return () => { alive = false; };
  }, [stadiumId, role]);
  return scale;
}

export const fmt = (v: number | null | undefined, d = 1) => (v == null ? "–" : v.toFixed(d));
export const signed = (v: number | null | undefined, d = 1) => (v == null ? "–" : `${v > 0 ? "+" : ""}${v.toFixed(d)}`);

export function useApi<T>(path: string | null, params?: Record<string, string | number | undefined | null>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const key = path ? path + JSON.stringify(params ?? {}) : null;
  useEffect(() => {
    if (!path) { setData(null); return; }
    let alive = true;
    setLoading(true);
    setError(null);
    api<T>(path, params)
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { data, error, loading, retry };
}

type AppState = {
  meta: Meta | null;
  selectedDate: string | null;
  setSelectedDate: (d: string | null) => void;
};
const Ctx = createContext<AppState>(null!);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  useEffect(() => { api<Meta>("/meta").then(setMeta).catch(() => setMeta(null)); }, []);
  return <Ctx.Provider value={{ meta, selectedDate, setSelectedDate }}>{children}</Ctx.Provider>;
}
export const useAppState = () => useContext(Ctx);

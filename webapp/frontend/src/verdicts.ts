// Única fuente de las reglas de veredicto.
//
// Los veredictos son RELATIVOS AL PARQUE: comparan el Stuff+ de un lanzador contra el de toda la
// liga proyectada en ese mismo parque (su ranking). Con el modelo real, el Stuff+ por lanzador
// tiene una desviación de ~4.5 y la altura mueve a todos ~±6 puntos (Harp Helú ~94, Cancún ~107),
// así que un corte absoluto dejaba a casi todos "Evitar" en casa y "Bueno" al nivel del mar.

export type StuffVerdict = "elite" | "good" | "avg" | "avoid";
export type SignVerdict = "sign" | "watch" | "no";
export type VerdictKind = StuffVerdict | SignVerdict;

/** Percentiles dentro del parque: Élite = 5% más alto · Bueno = siguiente 20% · Evitar = 15% más bajo. */
export const PARK_PCT = { elite: 0.95, good: 0.75, avoid: 0.15 } as const;

/** Cortes de Stuff+ en un parque, calculados de su ranking. */
export type ParkScale = { elite: number; good: number; avoid: number; n: number };

function quantile(sorted: number[], q: number): number {
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export function scaleFrom(values: number[]): ParkScale | null {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (v.length < 10) return null;
  return { elite: quantile(v, PARK_PCT.elite), good: quantile(v, PARK_PCT.good), avoid: quantile(v, PARK_PCT.avoid), n: v.length };
}

export function verdictFor(stuff: number | null | undefined, scale: ParkScale | null | undefined): StuffVerdict | null {
  if (stuff == null || Number.isNaN(stuff) || !scale) return null;
  if (stuff >= scale.elite) return "elite";
  if (stuff >= scale.good) return "good";
  if (stuff >= scale.avoid) return "avg";
  return "avoid";
}

/** Fichajes, sobre la escala del Harp Helú DE SU MISMO ROL (abridores contra abridores, relevistas contra
 *  relevistas: los relevistas tiran más fuerte en salidas cortas y su Stuff+ es más alto).
 *  Con `fit` (vs. la mediana de nuestro staff en su rol) manda la regla del brief; sin staff con qué
 *  comparar (`fit` nulo) decide su lugar entre los de su rol en la liga en casa. */
export const FA_RULES = {
  fitSign: 5,          // Fichar: fit ≥ +5 y al menos "Bueno" en casa
  fitWatch: 0,         // Vigilar: fit entre 0 y 5; No: fit < 0
  minPitches: 300,     // menos que esto es "muestra chica"
} as const;

export type Signing = { verdict: SignVerdict; smallSample: boolean; noStaff: boolean };

export function signingFor(row: { fit: number | null; stuff_home: number; n_pitches: number }, home: ParkScale): Signing {
  const smallSample = row.n_pitches < FA_RULES.minPitches;
  const noStaff = row.fit == null;
  let verdict: SignVerdict;
  if (row.fit == null) {
    verdict = row.stuff_home >= home.elite ? "sign" : row.stuff_home >= home.good ? "watch" : "no";
  } else if (row.fit >= FA_RULES.fitSign && row.stuff_home >= home.good) {
    verdict = "sign";
  } else if (row.fit >= FA_RULES.fitWatch) {
    verdict = "watch";
  } else {
    verdict = "no";
  }
  // La muestra chica nunca alcanza para "Fichar": a lo más se vigila.
  if (smallSample && verdict === "sign") verdict = "watch";
  return { verdict, smallSample, noStaff };
}

/** Color del token de veredicto (para números sueltos; el veredicto completo usa <Verdict>). */
export const VERDICT_COLOR: Record<VerdictKind, string> = {
  elite: "var(--v-elite)", good: "var(--v-good)", avg: "var(--v-avg)", avoid: "var(--v-avoid)",
  sign: "var(--v-elite)", watch: "var(--v-watch)", no: "var(--v-avoid)",
};

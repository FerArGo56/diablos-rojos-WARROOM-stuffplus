// Única fuente de los umbrales de veredicto. Stuff+ = 100 + 10·z (100 = promedio de la liga).

export type StuffVerdict = "elite" | "good" | "avg" | "avoid";
export type SignVerdict = "sign" | "watch" | "no";
export type VerdictKind = StuffVerdict | SignVerdict;

/** Élite ≥115 · Bueno 105–115 · Promedio 90–105 · Evitar <90 */
export const STUFF_THRESHOLDS = { elite: 115, good: 105, avg: 90 } as const;

export function verdictFor(stuff: number | null | undefined): StuffVerdict | null {
  if (stuff == null || Number.isNaN(stuff)) return null;
  if (stuff >= STUFF_THRESHOLDS.elite) return "elite";
  if (stuff >= STUFF_THRESHOLDS.good) return "good";
  if (stuff >= STUFF_THRESHOLDS.avg) return "avg";
  return "avoid";
}

/** Fichajes. Con `fit` (vs. la mediana de nuestro staff en su rol) manda la regla del brief;
 *  sin staff con qué comparar (`fit` nulo) se usa el Stuff+ proyectado en casa. */
export const FA_RULES = {
  fitSign: 5,          // Fichar: fit ≥ +5 …
  homeSign: 105,       // … y Stuff+ en casa ≥ 105
  fitWatch: 0,         // Vigilar: fit entre 0 y 5; No: fit < 0
  minPitches: 300,     // menos que esto es "muestra chica"
  fallback: { sign: 115, watch: 105 },   // sin fit: Fichar ≥115 · Vigilar 105–115 · No <105
} as const;

export type Signing = { verdict: SignVerdict; smallSample: boolean; noStaff: boolean };

export function signingFor(row: { fit: number | null; stuff_home: number; n_pitches: number }): Signing {
  const smallSample = row.n_pitches < FA_RULES.minPitches;
  const noStaff = row.fit == null;
  let verdict: SignVerdict;
  if (row.fit == null) {
    verdict = row.stuff_home >= FA_RULES.fallback.sign ? "sign" : row.stuff_home >= FA_RULES.fallback.watch ? "watch" : "no";
  } else if (row.fit >= FA_RULES.fitSign && row.stuff_home >= FA_RULES.homeSign) {
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

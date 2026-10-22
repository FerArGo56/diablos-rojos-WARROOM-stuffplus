// Frases generadas desde los datos. Aquí solo se elige qué decir y se rellenan los números;
// los textos (ES/EN) viven en i18n.tsx. Nada se escribe a mano por lanzador.
import type { Reason, StadiumDetail } from "./api";
import { PITCH_NAMES, type Key, type Lang, useLang } from "./i18n";

type T = ReturnType<typeof useLang>["t"];

/** Diferencia mínima de movimiento (pulgadas) para mencionarla. */
export const MOVE_MIN_IN = 1.5;
/** Diferencia mínima de Stuff+ para aconsejar usarlo más o menos. */
const ADVICE_MIN_STUFF = 2;

const num = (lang: Lang, v: number, d = 1) =>
  new Intl.NumberFormat(lang === "es" ? "es-MX" : "en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);

export function pitchName(lang: Lang, pt: string, inSentence = false): string {
  const n = PITCH_NAMES[lang][pt] ?? pt;
  return inSentence && lang === "es" ? n.charAt(0).toLowerCase() + n.slice(1) : n;
}

export function reasonPhrase(t: T, r: Reason): string {
  return t(`r_${r.code}` as Key, r.value ?? null);
}

/** Tono de una razón del bullpen: suma, resta o solo informa. */
export function reasonTone(code: string): "good" | "bad" | "info" {
  if (code.endsWith("_plus")) return "good";
  if (code.endsWith("_minus") || ["back_to_back", "heavy_yesterday", "heavy_3d", "starter_in_rotation"].includes(code)) return "bad";
  return "info";
}

type Side = { ivb: number; hb: number; stuff_plus?: number };

/** "Su sinker cae 4.0 in menos aquí: úsalo menos". Compara magnitudes (la altura encoge el quiebre).
 *  El consejo solo aparece cuando el movimiento y el Stuff+ apuntan al mismo lado. */
export function pitchPhrase(t: T, lang: Lang, pt: string, sea: Side, here: Side): string {
  const p = pitchName(lang, pt, true);
  const dv = Math.abs(here.ivb) - Math.abs(sea.ivb);
  const dh = Math.abs(here.hb) - Math.abs(sea.hb);
  const vertical = Math.abs(dv) >= Math.abs(dh);
  const d = vertical ? dv : dh;
  if (Math.abs(d) < MOVE_MIN_IN) return t("pp_same", { p });
  const lose = d < 0;
  const key: Key = vertical
    ? (sea.ivb >= 0 ? (lose ? "pp_vert_pos_lose" : "pp_vert_pos_gain") : (lose ? "pp_vert_neg_lose" : "pp_vert_neg_gain"))
    : (lose ? "pp_horiz_lose" : "pp_horiz_gain");
  let out = t(key, { p, n: num(lang, Math.abs(d)) });
  if (here.stuff_plus != null && sea.stuff_plus != null) {
    const ds = here.stuff_plus - sea.stuff_plus;
    if (lose && ds <= -ADVICE_MIN_STUFF) out += t("pp_useLess");
    else if (!lose && ds >= ADVICE_MIN_STUFF) out += t("pp_useMore");
  }
  return out;
}

/** "Aquí la bola se mueve 22% menos que a nivel del mar. La que más sufre: la recta." */
export function parkPhrase(t: T, lang: Lang, st: Pick<StadiumDetail, "movement_retained_pct" | "league_by_pitch_type">): string {
  const lost = Math.round(100 - st.movement_retained_pct);
  if (lost < 3 || !st.league_by_pitch_type.length) return t("park_same");
  const worst = [...st.league_by_pitch_type].sort((a, b) =>
    (Math.hypot(a.ivb_here, a.hb_here) - Math.hypot(a.ivb_sea, a.hb_sea)) - (Math.hypot(b.ivb_here, b.hb_here) - Math.hypot(b.ivb_sea, b.hb_sea)))[0];
  return t("park_lose", { pct: lost, p: pitchName(lang, worst.pitch_type, true) });
}

/** Una frase por lanzador: aporte al staff (si se sabe), efecto del parque y su mejor pitcheo.
 *  `where`: "home" = Harp Helú (se dice "en la altura"); "here" = el parque que se está viendo. */
export function pitcherPhrase(t: T, lang: Lang, r: { role: string; fit?: number | null; altitude_delta: number; best_pitch: string | null }, where: "home" | "here" = "home"): string {
  const parts: string[] = [];
  if (r.fit != null) {
    const u = t(r.role === "SP" ? "ph_unit_sp" : "ph_unit_rp");
    parts.push(r.fit >= 0 ? t("ph_fit_plus", { u, n: `+${num(lang, r.fit)}` }) : t("ph_fit_minus", { u, n: num(lang, Math.abs(r.fit)) }));
  }
  const a = r.altitude_delta;
  const k = where === "home" ? { same: "ph_alt_same", gain: "ph_alt_gain", lose: "ph_alt_lose" } as const : { same: "ph_here_same", gain: "ph_here_gain", lose: "ph_here_lose" } as const;
  parts.push(Math.abs(a) < 0.5 ? t(k.same) : t(a > 0 ? k.gain : k.lose, { n: num(lang, Math.abs(a)) }));
  if (r.best_pitch) parts.push(t("ph_best", { p: pitchName(lang, r.best_pitch, true) }));
  return parts.join(" ");
}

import { useCallback, useEffect, useRef, useState } from "react";
import type { StadiumDetail } from "../api";
import { fmtInt, useLang } from "../i18n";
import { INTRO_CONFIG, VIDEO, hasVideo } from "../media";
import { useApi, useAppState } from "../state";

const SESSION_KEY = "intro-visto";        // compu: una vez por sesión
const MOBILE_KEY = "intro-movil-visto";   // celular: solo la primera visita
const START_MS = 2000;                    // si el video no arranca en este tiempo (red lenta), se salta
const PHRASE_MIN_MS = 1500;               // la frase final se lee al menos esto antes del fade
const FADE_MS = 300;

const isMobile = () => window.matchMedia?.("(max-width: 767px)").matches ?? false;
const storage = (mobile: boolean) => { try { return mobile ? localStorage : sessionStorage; } catch { return null; } };

/** ¿Toca intro? Solo al entrar por Hoy, si el video existe, sin reduced-motion ni ahorro de datos, y no
 *  vista antes (sesión en compu, nunca en celular). */
function eligible(mobile: boolean): boolean {
  if (window.location.pathname !== "/") return false;
  if (!hasVideo(mobile ? VIDEO.introMovil : VIDEO.intro)) return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return false;
  try { return storage(mobile)?.getItem(mobile ? MOBILE_KEY : SESSION_KEY) !== "1"; } catch { return true; }
}

/** Altitud en el segundo `t` según los puntos de sincronía (interpolación lineal). */
function altitudeAt(points: [number, number][], t: number): number {
  if (t <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [t1, a1] = points[i], [t0, a0] = points[i - 1];
    if (t <= t1) return a0 + ((a1 - a0) * (t - t0)) / (t1 - t0);
  }
  return points[points.length - 1][1];
}

/** "Del cielo al montículo": intro a pantalla completa encima de Hoy, con un altímetro (en código, no en
 *  el video) que baja hasta la altitud del parque de casa y la frase de cuánto menos se mueve la bola.
 *  "Saltar" está visible desde el segundo 0 (también Escape). Se cancela sola si el video no arranca
 *  o al llegar al máximo; la app ya cargó detrás. */
export function IntroVideo() {
  const { t, lang } = useLang();
  const { meta } = useAppState();
  const mobile = useRef(isMobile()).current;
  const file = mobile ? VIDEO.introMovil : VIDEO.intro;
  const [stage, setStage] = useState<"show" | "leaving" | "off">(() => (eligible(mobile) ? "show" : "off"));
  const { data: home } = useApi<StadiumDetail>(stage !== "off" ? `/stadiums/${meta?.home_stadium_id ?? "harp-helu"}` : null);
  const video = useRef<HTMLVideoElement>(null);
  const alt = useRef<HTMLSpanElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const [phrase, setPhrase] = useState(false);
  const phraseAt = useRef<number | null>(null);
  const started = useRef(false);

  const points = (() => {
    const p = (mobile ? INTRO_CONFIG.altimeterMobile : INTRO_CONFIG.altimeterDesktop).map(([s, m]) => [s, m] as [number, number]);
    if (home) p[p.length - 1][1] = home.altitude_m; // termina en la altitud real del parque de casa
    return p;
  })();
  const pointsRef = useRef(points); pointsRef.current = points;
  const pct = home ? Math.round(100 - home.movement_retained_pct) : null;

  const close = useCallback(() => {
    setStage((s) => (s === "show" ? "leaving" : s));
    window.setTimeout(() => { setStage("off"); document.getElementById("main")?.focus({ preventScroll: true }); }, FADE_MS);
  }, []);
  // Termina "bien": deja leer la frase final al menos PHRASE_MIN_MS antes del fade.
  const end = useCallback(() => {
    if (phraseAt.current == null) { phraseAt.current = performance.now(); setPhrase(true); }
    const wait = Math.max(0, PHRASE_MIN_MS - (performance.now() - phraseAt.current));
    video.current?.pause();
    window.setTimeout(close, wait);
  }, [close]);

  // Mientras se muestra: marcar como vista, foco en "Saltar", Escape, límite de tiempo y video que no arranca.
  useEffect(() => {
    if (stage !== "show") return;
    try { storage(mobile)?.setItem(mobile ? MOBILE_KEY : SESSION_KEY, "1"); } catch { /* sin almacenamiento */ }
    skip.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const max = window.setTimeout(end, (mobile ? INTRO_CONFIG.maxSecondsMobile : INTRO_CONFIG.maxSecondsDesktop) * 1000);
    const stall = window.setTimeout(() => { if (!started.current) close(); }, START_MS);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    // altímetro: sigue el tiempo del video cuadro a cuadro (directo en el DOM)
    let raf = 0;
    const tick = () => {
      const v = video.current, pts = pointsRef.current;
      if (v && alt.current) {
        alt.current.textContent = `${fmtInt(lang, altitudeAt(pts, v.currentTime))} m`;
        if (phraseAt.current == null && v.currentTime >= pts[pts.length - 1][0]) { phraseAt.current = performance.now(); setPhrase(true); }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { window.clearTimeout(max); window.clearTimeout(stall); document.removeEventListener("keydown", onKey); cancelAnimationFrame(raf); document.body.style.overflow = prevOverflow; };
  }, [stage, mobile, end, close, lang]);

  if (stage === "off") return null;
  return (
    <div className={`intro ${stage === "leaving" ? "is-leaving" : ""}`} role="dialog" aria-modal="true" aria-label={t("introLabel")}>
      <video ref={video} src={file.src} poster={file.poster} autoPlay muted playsInline aria-hidden="true"
        onPlaying={() => { started.current = true; }} onEnded={end} onError={close} />
      <div className="intro-hud" aria-hidden="true">
        <span className="intro-alt-l">{t("altitude")}</span>
        <span ref={alt} className="intro-alt">{fmtInt(lang, points[0][1])} m</span>
      </div>
      {phrase && pct != null && <p className="intro-phrase" role="status">{t("introPhrase", { pct })}</p>}
      <button ref={skip} type="button" className="intro-skip" onClick={close}>{t("introSkip")}</button>
    </div>
  );
}

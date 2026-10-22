import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "../i18n";
import { INTRO } from "../media";

const SEEN_KEY = "intro-visto";   // guarda la fecha del último día que se vio
const MAX_MS = 6000;             // nunca más de esto, aunque el video sea más largo
const START_MS = 2000;           // si no arranca en este tiempo (red lenta), se salta
const FADE_MS = 300;

const today = () => new Date().toLocaleDateString("en-CA");

/** ¿Toca intro? Solo si hay video, la primera vez del día, y sin reduced-motion ni ahorro de datos. */
function shouldShow(): boolean {
  if (!INTRO) return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return false;
  try { return localStorage.getItem(SEEN_KEY) !== today(); } catch { return true; }
}

/** Intro a pantalla completa (5 s, del estadio) antes de Hoy. La app carga detrás mientras corre.
 *  Se salta con el botón, con cualquier toque o con Escape; se cancela sola si tarda o falla. */
export function IntroSplash() {
  const { t } = useLang();
  const [show, setShow] = useState(shouldShow);
  const [leaving, setLeaving] = useState(false);
  const skip = useRef<HTMLButtonElement>(null);
  const started = useRef(false);
  const portrait = useRef(window.matchMedia?.("(orientation: portrait)").matches ?? true).current;

  const finish = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => {
      setShow(false);
      document.getElementById("main")?.focus({ preventScroll: true }); // el foco no se pierde al cerrar
    }, FADE_MS);
  }, []);

  useEffect(() => {
    if (!show) return;
    try { localStorage.setItem(SEEN_KEY, today()); } catch { /* sin almacenamiento: puede volver a salir */ }
    skip.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const max = window.setTimeout(finish, MAX_MS);
    const stall = window.setTimeout(() => { if (!started.current) finish(); }, START_MS);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") finish(); };
    document.addEventListener("keydown", onKey);
    return () => { window.clearTimeout(max); window.clearTimeout(stall); document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [show, finish]);

  if (!show || !INTRO) return null;
  return (
    <div className={`intro ${leaving ? "is-leaving" : ""}`} role="dialog" aria-modal="true" aria-label={t("introLabel")} onClick={finish}>
      <video src={portrait ? INTRO.portrait : INTRO.landscape} poster={INTRO.poster} autoPlay muted playsInline aria-hidden="true"
        onPlaying={() => { started.current = true; }} onEnded={finish} onError={finish} />
      <button ref={skip} type="button" className="intro-skip" onClick={(e) => { e.stopPropagation(); finish(); }}>{t("introSkip")}</button>
    </div>
  );
}

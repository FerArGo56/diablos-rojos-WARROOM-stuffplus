import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "../i18n";
import { INTRO_CONFIG, VIDEO, hasVideo } from "../media";

const SESSION_KEY = "intro-visto";        // compu: una vez por sesión
const MOBILE_KEY = "intro-movil-visto";   // celular: solo la primera visita
const START_MS = 2000;                    // si el video no arranca en este tiempo (red lenta), se salta
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

/** "Del cielo al montículo": intro a pantalla completa encima de Hoy, solo el video (sin texto encima).
 *  "Saltar" está visible desde el segundo 0 (también Escape). Se cierra al terminar, al llegar al máximo
 *  o si el video no arranca; la app ya cargó detrás. */
export function IntroVideo() {
  const { t } = useLang();
  const mobile = useRef(isMobile()).current;
  const file = mobile ? VIDEO.introMovil : VIDEO.intro;
  const [stage, setStage] = useState<"show" | "leaving" | "off">(() => (eligible(mobile) ? "show" : "off"));
  const skip = useRef<HTMLButtonElement>(null);
  const started = useRef(false);

  const close = useCallback(() => {
    setStage((s) => (s === "show" ? "leaving" : s));
    window.setTimeout(() => { setStage("off"); document.getElementById("main")?.focus({ preventScroll: true }); }, FADE_MS);
  }, []);

  useEffect(() => {
    if (stage !== "show") return;
    try { storage(mobile)?.setItem(mobile ? MOBILE_KEY : SESSION_KEY, "1"); } catch { /* sin almacenamiento */ }
    skip.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const max = window.setTimeout(close, (mobile ? INTRO_CONFIG.maxSecondsMobile : INTRO_CONFIG.maxSecondsDesktop) * 1000);
    const stall = window.setTimeout(() => { if (!started.current) close(); }, START_MS);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => { window.clearTimeout(max); window.clearTimeout(stall); document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [stage, mobile, close]);

  if (stage === "off") return null;
  return (
    <div className={`intro ${stage === "leaving" ? "is-leaving" : ""}`} role="dialog" aria-modal="true" aria-label={t("introLabel")}>
      <video src={file.src} poster={file.poster} autoPlay muted playsInline aria-hidden="true"
        onPlaying={() => { started.current = true; }} onEnded={close} onError={close} />
      <button ref={skip} type="button" className="intro-skip" onClick={close}>{t("introSkip")}</button>
    </div>
  );
}

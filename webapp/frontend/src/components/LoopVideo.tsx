import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n";

export type LoopVideoSource = {
  src: string;          // MP4 (H.264) para que funcione en iPhone
  poster: string;       // imagen fija: lo que se ve antes de cargar y con reduced-motion
  label?: string;       // si el video comunica algo; sin label es decorativo
  ratio?: string;       // relación de aspecto, p. ej. "16 / 9"
};

/** Video en bucle, silencioso y ligero:
 *  - el archivo solo se descarga cuando el video está por aparecer en pantalla;
 *  - se pausa fuera de pantalla o con la pestaña oculta;
 *  - con reduced-motion o ahorro de datos no arranca solo (queda el póster);
 *  - siempre hay un botón para pausar o reproducir. */
export function LoopVideo({ src, poster, label, ratio = "16 / 9" }: LoopVideoSource) {
  const { t } = useLang();
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === "visible");
  const [reduce, setReduce] = useState(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const [wants, setWants] = useState<boolean | null>(null); // decisión del usuario con el botón; null = automático
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const loadIo = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); loadIo.disconnect(); } }, { rootMargin: "300px" });
    const playIo = new IntersectionObserver(([e]) => setVisible(e.isIntersecting && e.intersectionRatio >= 0.25), { threshold: [0, 0.25, 1] });
    loadIo.observe(el); playIo.observe(el);
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduce(mq.matches);
    mq?.addEventListener("change", onMq);
    return () => { loadIo.disconnect(); playIo.disconnect(); document.removeEventListener("visibilitychange", onVis); mq?.removeEventListener("change", onMq); };
  }, []);

  const shouldPlay = near && visible && pageVisible && (wants ?? (!reduce && !saveData));
  useEffect(() => {
    const v = video.current;
    if (!v || !near) return;
    if (shouldPlay) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [shouldPlay, near]);

  return (
    <div ref={box} className="loop-video" style={{ aspectRatio: ratio }}>
      <video ref={video} poster={poster} muted loop playsInline preload="none"
        aria-label={label} aria-hidden={label ? undefined : true}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}>
        {near && <source src={src} type="video/mp4" />}
      </video>
      <button type="button" className={`loop-video-btn ${playing ? "is-playing" : ""}`}
        aria-label={playing ? t("videoPause") : t("videoPlay")} onClick={() => setWants(!playing)}>
        <span aria-hidden="true" />
      </button>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n";
import { hasVideo, type VideoFile } from "../media";

type Props = VideoFile & {
  label?: string;                 // si el video comunica algo; sin label es decorativo
  ratio?: string;                 // relación de aspecto del contenedor, p. ej. "16 / 9"
  variant?: "inline" | "background";
  className?: string;
};

/** Video en bucle, silencioso y ligero. No se pinta si el video no está en public/video/.
 *  - el archivo solo se descarga cuando el video está por aparecer en pantalla (mientras, el póster);
 *  - se pausa fuera de pantalla o con la pestaña oculta;
 *  - con reduced-motion o ahorro de datos no arranca solo: queda el póster;
 *  - siempre hay un botón para pausar o reproducir.
 *  `background`: ocupa su contenedor (posición absoluta) para ir detrás de un encabezado. */
export function LoopVideo({ src, poster, label, ratio = "16 / 9", variant = "inline", className = "" }: Props) {
  if (!hasVideo({ src, poster })) return null;
  return <LoopVideoPlayer src={src} poster={poster} label={label} ratio={ratio} variant={variant} className={className} />;
}

function LoopVideoPlayer({ src, poster, label, ratio, variant, className }: Required<Omit<Props, "label">> & { label?: string }) {
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
    <div ref={box} className={`loop-video loop-video-${variant} ${className}`} style={variant === "inline" ? { aspectRatio: ratio } : undefined}>
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

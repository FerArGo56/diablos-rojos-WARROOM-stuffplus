import type { LoopVideoSource } from "./components/LoopVideo";

// Videos de la app (etapa 2). Mientras un lugar no tenga video, no se pinta nada: no hay espacios
// vacíos reservados. Los archivos van en public/videos/ (MP4 H.264, para que funcionen en iPhone).

/** Intro de 5 s a pantalla completa antes de Hoy (Higgsfield, toma FPV del estadio), la primera vez
 *  del día. `portrait` 9:16 para celular, `landscape` 16:9 para compu y proyector. p. ej.:
 *    { portrait: "/videos/intro-9x16.mp4", landscape: "/videos/intro-16x9.mp4", poster: "/videos/intro.jpg" } */
export type IntroSource = { portrait: string; landscape: string; poster?: string };
export const INTRO: IntroSource | null = null;

/** Videos en bucle dentro de las pantallas, p. ej. el video Brag en Lanzador:
 *    lanzador: { src: "/videos/brag.mp4", poster: "/videos/brag.jpg", label: "…" } */
export const VIDEOS: { lanzador?: LoopVideoSource } = {};

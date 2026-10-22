import type { LoopVideoSource } from "./components/LoopVideo";

// Videos de la app (etapa 2: intro de Higgsfield y video Brag). Mientras un lugar no tenga video,
// no se pinta nada: no hay espacios vacíos reservados. Para activarlo, poner el MP4 y su póster en
// public/videos/ y llenar la entrada, p. ej.:
//   hoy: { src: "/videos/intro.mp4", poster: "/videos/intro.jpg", label: "Intro de Diablos Stuff+" }
export const VIDEOS: { hoy?: LoopVideoSource; lanzador?: LoopVideoSource } = {};

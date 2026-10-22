// Videos de la app (etapa 2). Van en public/video/ como MP4 H.264, sin audio, con +faststart, y su
// póster .jpg (el último cuadro) con el mismo nombre + "-poster". Vite revisa la carpeta al compilar:
// si un video no está, su lugar no se pinta (cero espacios vacíos). Al agregar uno: npm run build.

export type VideoFile = { src: string; poster: string };
const file = (name: string): VideoFile => ({ src: `/video/${name}.mp4`, poster: `/video/${name}-poster.jpg` });

/** ¿Está el video (y su póster) en public/video/? Se sabe desde el primer momento. */
export const hasVideo = (f: VideoFile) => __VIDEO_FILES__.includes(f.src) && __VIDEO_FILES__.includes(f.poster);

export const VIDEO = {
  /** 1. "Del cielo al montículo": intro a pantalla completa en compu/proyector (16:9, 1920 px, ≤ 6 MB). */
  intro: file("intro"),
  /** 1b. Los últimos ~4 s de la intro para celular (720p, ≤ 2 MB). Si no existe, en celular no hay intro. */
  introMovil: file("intro-movil"),
  /** 2. "El lanzamiento": fondo del encabezado de Explorar (16:9, 1280 px, 4 s en bucle, ≤ 2 MB). */
  lanzamiento: file("lanzamiento-loop"),
  /** 3. "Imagina a tu lanzador": estado vacío de ¿Y si…? (4:5). Nunca en el perfil de un lanzador real. */
  pitcherVertical: file("pitcher-vertical"),
  /** 4. "La física": junto a la explicación de la altitud en Metodología (16:9, 3–4 s). */
  giroLento: file("giro-lento"),
};

/** Intro: duración máxima y altímetro. Los puntos de sincronía son [segundo del video, metros] y se
 *  interpolan en línea recta entre ellos; se afinan cuando llegue el video real (el dron no baja a
 *  velocidad constante). El último punto debe ser la altitud del Harp Helú. */
export const INTRO_CONFIG = {
  maxSecondsDesktop: 10,
  maxSecondsMobile: 5,
  altimeterDesktop: [[0, 4000], [3, 3600], [6, 2700], [8.5, 2232]] as [number, number][],
  altimeterMobile: [[0, 2600], [3, 2232]] as [number, number][],
};

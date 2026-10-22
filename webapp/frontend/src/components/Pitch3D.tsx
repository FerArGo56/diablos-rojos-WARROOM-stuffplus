import { useEffect, useRef, useState } from "react";
import type { PathPoint, ProjectedPitch } from "../api";
import { useLang } from "../i18n";
import { PITCH_COLORS } from "../state";

// Vista 3D con las trayectorias reales del API (pies): y = distancia al home (50 al soltar, 1.42 en el
// home), x = lateral, z = altura. Proyección en perspectiva propia, sin librerías.
const W = 440;
const H = 500;
const FOCAL = 520;
const TARGET = { x: 0, y: 9, z: 2.9 };       // la cámara mira el último tramo del vuelo, donde se separan
const DIST = 21;
const PLATE_Y = 17 / 12;
const BALL = 0.121 * 2;                        // radio de la bola (pies), dibujada al doble para que se vea
const FLIGHT_MS = 1800;                        // cámara lenta: el vuelo real dura ~0.45 s
const PAUSE_MS = 700;
const DEFAULT_VIEW = { yaw: -24, pitch: 9 };   // grados: atrás del home, un poco a un lado y arriba

type Cam = { yaw: number; pitch: number };
type V3 = { x: number; y: number; z: number };

function camera({ yaw, pitch }: Cam) {
  const a = (yaw * Math.PI) / 180, b = (pitch * Math.PI) / 180;
  const pos = { x: TARGET.x + DIST * Math.sin(a) * Math.cos(b), y: TARGET.y - DIST * Math.cos(a) * Math.cos(b), z: TARGET.z + DIST * Math.sin(b) };
  const f = norm({ x: TARGET.x - pos.x, y: TARGET.y - pos.y, z: TARGET.z - pos.z });
  const r = norm(cross(f, { x: 0, y: 0, z: 1 }));
  const u = cross(r, f);
  return (p: V3): [number, number, number] | null => {
    const v = { x: p.x - pos.x, y: p.y - pos.y, z: p.z - pos.z };
    const zc = dot(v, f);
    if (zc < 1) return null;
    return [W / 2 + (FOCAL * dot(v, r)) / zc, H / 2 - (FOCAL * dot(v, u)) / zc, zc];
  };
}
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V3, b: V3): V3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const norm = (a: V3): V3 => { const n = Math.hypot(a.x, a.y, a.z) || 1; return { x: a.x / n, y: a.y / n, z: a.z / n }; };

type Proj = ReturnType<typeof camera>;
const pts = (proj: Proj, ps: V3[]) => ps.map(proj).filter((p): p is [number, number, number] => !!p).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const ring = (cx: number, cy: number, r: number, z = 0, n = 40): V3[] => Array.from({ length: n + 1 }, (_, i) => ({ x: cx + r * Math.cos((i / n) * 2 * Math.PI), y: cy + r * Math.sin((i / n) * 2 * Math.PI), z }));
const at = (path: PathPoint[], t: number): V3 => {
  const f = Math.max(0, Math.min(1, t)) * (path.length - 1), i = Math.floor(f), k = f - i, a = path[i], b = path[Math.min(i + 1, path.length - 1)];
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k };
};

export function Pitch3D({ pitches, visible, labels }: { pitches: ProjectedPitch[]; visible: Set<string>; labels: { sea: string; here: string } }) {
  const { t } = useLang();
  const [cam, setCam] = useState<Cam>(DEFAULT_VIEW);
  const [paused, setPaused] = useState(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  const proj = camera(cam);
  const projRef = useRef(proj); projRef.current = proj;
  const balls = useRef(new Map<string, { sea: SVGCircleElement | null; here: SVGCircleElement | null }>());
  const drag = useRef<{ x: number; y: number; cam: Cam } | null>(null);
  const shown = pitches.filter((p) => visible.has(p.pitch_type));

  // Animación: mueve las bolas directo en el DOM (sin re-render por cuadro). En pausa quedan en el home.
  useEffect(() => {
    const place = (tt: number) => {
      for (const p of shown) {
        const el = balls.current.get(p.pitch_type);
        for (const side of ["sea", "here"] as const) {
          const c = el?.[side]; if (!c) continue;
          const q = projRef.current(at(p[side].path, tt));
          if (!q) { c.setAttribute("r", "0"); continue; }
          c.setAttribute("cx", q[0].toFixed(1)); c.setAttribute("cy", q[1].toFixed(1)); c.setAttribute("r", Math.max(4, (FOCAL * BALL) / q[2]).toFixed(1));
        }
      }
    };
    if (paused) { place(1); return; }
    let raf = 0; const start = performance.now();
    const tick = (now: number) => { const e = (now - start) % (FLIGHT_MS + PAUSE_MS); place(Math.min(1, e / FLIGHT_MS)); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, shown.map((p) => p.pitch_type).join(), cam]);

  const rotate = (dyaw: number, dpitch: number) => setCam((c) => ({ yaw: c.yaw + dyaw, pitch: Math.max(2, Math.min(70, c.pitch + dpitch)) }));
  const plate = [[-0.708, PLATE_Y], [0.708, PLATE_Y], [0.708, PLATE_Y - 0.708], [0, 0], [-0.708, PLATE_Y - 0.708]].map(([x, y]) => ({ x, y, z: 0 }));
  const zone = [[-0.708, 1.5], [0.708, 1.5], [0.708, 3.5], [-0.708, 3.5], [-0.708, 1.5]].map(([x, z]) => ({ x, y: PLATE_Y, z }));
  const mound = proj({ x: 0, y: 60.5, z: 0 });
  const home = proj({ x: 0, y: -2, z: 0 });

  return (
    <div className="pitch3d">
      <svg viewBox={`0 0 ${W} ${H}`} className="zone-svg pitch3d-svg" role="img" tabIndex={0}
        aria-label={`${t("view3dLabel")} ${t("view3dHelp")}`}
        onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, cam }; }}
        onPointerMove={(e) => { const d = drag.current; if (!d) return; setCam({ yaw: d.cam.yaw + (e.clientX - d.x) * 0.35, pitch: Math.max(2, Math.min(70, d.cam.pitch + (e.clientY - d.y) * 0.25)) }); }}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
        onKeyDown={(e) => {
          const k: Record<string, [number, number]> = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, 4], ArrowDown: [0, -4] };
          if (k[e.key]) { e.preventDefault(); rotate(...k[e.key]); }
        }}>
        {/* suelo: tierra alrededor del home y el montículo */}
        <polygon points={pts(proj, ring(0, 0.5, 13))} fill="#2a1b12" opacity="0.7" />
        <polygon points={pts(proj, ring(0, 59, 9))} fill="#2a1b12" opacity="0.7" />
        <polyline points={pts(proj, [{ x: 0, y: 0, z: 0 }, { x: 0, y: 60.5, z: 0 }])} stroke="var(--line-2)" strokeDasharray="3 5" fill="none" />
        <polygon points={pts(proj, plate)} fill="#e9e3d6" opacity="0.9" />
        {mound && <text x={mound[0]} y={mound[1] + 18} textAnchor="middle" fontSize="11" fill="var(--muted)">{t("mound")}</text>}
        {home && <text x={home[0]} y={home[1] + 18} textAnchor="middle" fontSize="11" fill="var(--muted)">{t("homePlate")}</text>}
        {/* zona de strike en el plano del home */}
        <polyline points={pts(proj, zone)} fill="rgba(239,233,220,0.04)" stroke="var(--chalk)" strokeWidth="1.5" />
        {/* trayectorias: nivel del mar (punteada) contra este parque (sólida) */}
        {shown.map((p) => (
          <g key={p.pitch_type} fill="none" stroke={PITCH_COLORS[p.pitch_type]} strokeLinecap="round" strokeLinejoin="round">
            <polyline points={pts(proj, p.sea.path)} strokeWidth="1.6" strokeDasharray="4 4" strokeOpacity="0.55" />
            <polyline points={pts(proj, p.here.path)} strokeWidth="2.4" strokeOpacity="0.85" />
          </g>
        ))}
        {shown.map((p) => (
          <g key={`b-${p.pitch_type}`}>
            <circle ref={(el) => { const m = balls.current.get(p.pitch_type) ?? { sea: null, here: null }; m.sea = el; balls.current.set(p.pitch_type, m); }} r="0" fill="none" stroke={PITCH_COLORS[p.pitch_type]} strokeWidth="1.5" strokeDasharray="2 2" />
            <circle ref={(el) => { const m = balls.current.get(p.pitch_type) ?? { sea: null, here: null }; m.here = el; balls.current.set(p.pitch_type, m); }} r="0" fill={PITCH_COLORS[p.pitch_type]} stroke="#0b0b0d" strokeWidth="1" />
          </g>
        ))}
      </svg>
      <div className="pitch3d-bar">
        <span className="faint tiny">{t("view3dHelp")}</span>
        <span className="pitch3d-legend tiny muted"><span className="lg-ring" aria-hidden="true" /> {labels.sea} <span className="lg-fill" aria-hidden="true" /> {labels.here}</span>
        <button type="button" className="btn" onClick={() => setCam(DEFAULT_VIEW)}>{t("view3dReset")}</button>
        <button type="button" className="btn" aria-pressed={!paused} onClick={() => setPaused((v) => !v)}>{paused ? t("animPlay") : t("animPause")}</button>
      </div>
    </div>
  );
}

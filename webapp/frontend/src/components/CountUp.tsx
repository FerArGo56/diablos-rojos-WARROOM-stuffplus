import { useEffect, useRef } from "react";

const DURATION = 600; // ms
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/** Número de "marcador" que cuenta hasta su valor al aparecer. Escribe directo en el DOM (sin re-render
 *  por cuadro), el lector de pantalla solo oye el valor final y con reduced-motion no se anima. */
export function CountUp({ value, format }: { value: number; format: (v: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { el.textContent = format(value); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      el.textContent = format(value * easeOut(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <>
      <span ref={ref} aria-hidden="true">{format(value)}</span>
      <span className="visually-hidden">{format(value)}</span>
    </>
  );
}

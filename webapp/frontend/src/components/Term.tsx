import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useLang } from "../i18n";

const GLOSSARY = { stuff: "g_stuff", ivb: "g_ivb", hb: "g_hb", whiff: "g_whiff", fit: "g_fit" } as const;

/** Término técnico con su explicación en lenguaje simple. Abre con hover, foco o toque; cierra con Escape. */
export function Term({ k, children }: { k: keyof typeof GLOSSARY; children: ReactNode }) {
  const { t } = useLang();
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const open = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 268)) });
  };
  const close = () => setPos(null);

  useEffect(() => {
    if (!pos) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const onScroll = () => close();
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => { document.removeEventListener("keydown", onKey); window.removeEventListener("scroll", onScroll, { capture: true }); };
  }, [pos]);

  return (
    <>
      <button ref={ref} type="button" className="term" aria-describedby={pos ? id : undefined}
        onMouseEnter={open} onMouseLeave={close} onFocus={open} onBlur={close}
        onClick={() => (pos ? close() : open())}>
        {children}
      </button>
      {pos && <span role="tooltip" id={id} className="term-tip" style={{ top: pos.top, left: pos.left }}>{t(GLOSSARY[k])}</span>}
    </>
  );
}

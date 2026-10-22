const ANON_ID = /^pitcher_(\d+)$/;

/** Nombre de un pitcher. Los IDs anónimos de la competencia ("pitcher_00420") se muestran como dorsal:
 *  rótulo chico + número grande (mismo dato, solo otra forma de verlo). Los nombres reales van tal cual. */
export function PitcherName({ name, className = "" }: { name: string; className?: string }) {
  const m = ANON_ID.exec(name);
  if (!m) return <span className={`pname ${className}`}>{name}</span>;
  return (
    <span className={`pname dorsal ${className}`}>
      <span className="dorsal-l">pitcher</span> <span className="dorsal-n">{m[1]}</span>
    </span>
  );
}

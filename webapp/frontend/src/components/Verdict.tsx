import type { Key } from "../i18n";
import { useLang } from "../i18n";
import type { VerdictKind } from "../verdicts";

// Forma + texto + color: nunca solo color. ◆ élite · ▲ a favor · ◐ prometedor · ● neutro · ▼ en contra.
const SHAPE: Record<VerdictKind, "diamond" | "up" | "half" | "dot" | "down"> = {
  elite: "diamond", good: "up", avg: "dot", avoid: "down",
  sign: "up", promising: "half", watch: "dot", no: "down",
};

export function Verdict({ kind, size = "md", note }: { kind: VerdictKind | null; size?: "sm" | "md" | "lg"; note?: string }) {
  const { t } = useLang();
  if (!kind) return <span className="verdict v-none">–</span>;
  return (
    <span className={`verdict v-${kind} v-${size}`}>
      <span className={`v-shape ${SHAPE[kind]}`} aria-hidden="true" />
      <span className="v-label">{t(`v_${kind}` as Key)}</span>
      {note && <span className="v-note">{note}</span>}
    </span>
  );
}

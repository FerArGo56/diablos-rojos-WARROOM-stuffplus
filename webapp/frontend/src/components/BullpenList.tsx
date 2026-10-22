import { Link } from "react-router-dom";
import type { Bullpen, Reliever } from "../api";
import { useLang, type Key } from "../i18n";
import { reasonPhrase, reasonTone } from "../phrases";
import { fmt } from "../state";
import { verdictFor } from "../verdicts";
import { Term } from "./Term";
import { Verdict } from "./Verdict";

const SLOT_ORDER = ["closer", "setup", "middle", "long", "depth"] as const;

/** Bullpen recomendado por rol (antes vivía en un drawer). El rediseño de las tarjetas queda para la final. */
export function BullpenList({ data }: { data: Bullpen }) {
  const { t } = useLang();
  return (
    <>
      {!data.workload_known && <p className="chip gold" style={{ marginBottom: 10 }}>{t("workloadUnknown")}</p>}
      {SLOT_ORDER.map((slot) => {
        const rows = data.relievers.filter((r) => r.slot === slot);
        if (!rows.length) return null;
        return (
          <div className="slot" key={slot}>
            <h3 className="slot-title">{t(slot as Key)}</h3>
            {rows.map((r) => <RelieverCard key={r.pitcher_id} r={r} slot={slot} />)}
          </div>
        );
      })}
      {data.relievers.some((r) => r.slot === "rest") && (
        <div className="slot">
          <h3 className="slot-title">{t("unavailable")}</h3>
          {data.relievers.filter((r) => r.slot === "rest").map((r) => <RelieverCard key={r.pitcher_id} r={r} slot="rest" />)}
        </div>
      )}
    </>
  );
}

function RelieverCard({ r, slot }: { r: Reliever; slot: string }) {
  const { t } = useLang();
  return (
    <div className={`rp-card ${slot === "closer" ? "closer" : ""}`} style={slot === "rest" ? { opacity: 0.7 } : undefined}>
      <div>
        <Link to={`/lanzador/${r.pitcher_id}`} className="num" style={{ fontWeight: 600 }}>{r.name}</Link>{" "}
        <span className="chip">{r.throws === "Right" ? "R" : "L"}HP</span>{" "}
        {r.status === "limited" && <span className="chip gold">{t("limited")}</span>}
      </div>
      <div style={{ textAlign: "right" }}>
        <Verdict kind={verdictFor(r.stuff_here)} size="sm" />{" "}
        <span className="num muted tiny">{fmt(r.stuff_here)} <Term k="stuff">{t("stuffHere")}</Term></span>
      </div>
      {r.reasons.length > 0 && (
        <div className="reasons">
          {r.reasons.map((x, i) => {
            const tone = reasonTone(x.code);
            return <span key={i} className={`chip ${tone === "good" ? "good" : tone === "bad" ? "bad" : "gold"}`}>{reasonPhrase(t, x)}</span>;
          })}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import type { FreeAgentRow, FreeAgents } from "../api";
import { useLang } from "../i18n";
import { pitchName, pitcherPhrase } from "../phrases";
import { fmt, signed, useApi, useAppState } from "../state";
import { FA_RULES, signingFor } from "../verdicts";
import { Term } from "./Term";
import { Verdict } from "./Verdict";

const PAGE = 50;
const MAX = 500; // tope del API

export function FreeAgentTable({ compact = false }: { compact?: boolean }) {
  const { t } = useLang();
  const { meta } = useAppState();
  const teamsKnown = meta?.capabilities?.has_teams !== false || meta?.has_rosters === true;
  const [pickedStatus, setStatus] = useState<"fa" | "signed" | "all">(compact ? "fa" : "all");
  const status = teamsKnown ? pickedStatus : "all";   // sin equipos no hay forma de filtrar agentes libres
  const [role, setRole] = useState<"" | "SP" | "RP">("");
  const [throws, setThrows] = useState<"" | "Right" | "Left">("");
  const [pickedSort, setSort] = useState<"home" | "neutral" | "fit">("home");
  const [limit, setLimit] = useState(compact ? 6 : PAGE);
  const { data, loading, error } = useApi<FreeAgents>("/free-agents", { status, role, throws, sort: pickedSort, limit });
  const noStaff = !!data && Object.values(data.our_medians).every((v) => v == null);
  const sort = noStaff && pickedSort === "fit" ? "home" : pickedSort;
  const resetPage = () => setLimit(compact ? 6 : PAGE);

  return (
    <div className={`fa ${compact ? "panel fa-compact" : ""}`}>
      {compact && (
        <div className="panel-head">
          <div>
            <h2 className="eyebrow">{t("faTitle")}</h2>
            <div className="muted small">{t("faHint")}</div>
          </div>
          <Link to="/agentes-libres" className="btn" style={{ padding: "5px 10px", fontSize: 13 }}>{t("seeAll")} →</Link>
        </div>
      )}
      <div className="fa-filters" role="group" aria-label={t("filters")}>
        {teamsKnown && (
          <div className="seg" role="group" aria-label={t("status")}>
            {(["fa", "signed", "all"] as const).map((s) => (
              <button key={s} type="button" className={status === s ? "on" : ""} aria-pressed={status === s} onClick={() => { setStatus(s); resetPage(); }}>{s === "fa" ? t("faOnly") : s === "signed" ? t("faSigned") : t("faAll")}</button>
            ))}
          </div>
        )}
        <div className="seg" role="group" aria-label={t("role")}>
          {(["", "SP", "RP"] as const).map((r) => <button key={r} type="button" className={role === r ? "on" : ""} aria-pressed={role === r} onClick={() => { setRole(r); resetPage(); }}>{r === "" ? t("any") : r === "SP" ? t("sp") : t("rp")}</button>)}
        </div>
        {!compact && (
          <>
            <div className="seg" role="group" aria-label={t("hand")}>
              {(["", "Right", "Left"] as const).map((h) => <button key={h} type="button" className={throws === h ? "on" : ""} aria-pressed={throws === h} onClick={() => { setThrows(h); resetPage(); }}>{h === "" ? t("any") : h === "Right" ? t("right") : t("left")}</button>)}
            </div>
            <label className="muted small fa-sort">{t("sortBy")}
              <select className="sel" value={sort} onChange={(e) => { setSort(e.target.value as typeof pickedSort); resetPage(); }}>
                <option value="home">{t("sortHome")}</option>
                <option value="neutral">{t("sortNeutral")}</option>
                {!noStaff && <option value="fit">{t("sortFit")}</option>}
              </select>
            </label>
          </>
        )}
      </div>
      {!compact && data && (
        <p className="fa-rule">
          {noStaff
            ? t("faNoStaffNote", { a: FA_RULES.fallback.sign, b: FA_RULES.fallback.watch })
            : t("faRuleNote", { a: `+${FA_RULES.fitSign}`, b: FA_RULES.homeSign })}{" "}
          <Term k="stuff">{t("whatIsStuff")}</Term>
        </p>
      )}

      {error && <p className="muted">{t("error")}</p>}
      {!data && !error && <div className="skel skel-card" aria-busy="true" />}
      {data && (
        <>
          <div className="fa-head" aria-hidden="true">
            <span>{t("verdictCol")}</span><span>{t("pitcher")}</span><span>{t("whyCol")}</span><span className="r">{t("stuffHome")}</span>{!compact && <span />}
          </div>
          <ul className="fa-list">
            {data.rows.map((r) => <FaRow key={r.pitcher_id} r={r} compact={compact} />)}
          </ul>
          {!compact && (
            <div className="fa-foot">
              <span className="faint small">{t("showing", { n: data.rows.length, total: data.total })}</span>
              {data.rows.length < Math.min(data.total, MAX) && (
                <button type="button" className="btn" disabled={loading} onClick={() => setLimit((l) => Math.min(l + PAGE, MAX))}>{t("showMore")}</button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FaRow({ r, compact }: { r: FreeAgentRow; compact: boolean }) {
  const { t, lang } = useLang();
  const s = signingFor(r);
  const hand = r.throws === "Right" ? t("right") : t("left");
  return (
    <li className="fa-row">
      <div className="fa-verdict"><Verdict kind={s.verdict} note={s.smallSample ? t("smallSample") : undefined} /></div>
      <div className="fa-who">
        <Link to={`/lanzador/${r.pitcher_id}`} className="fa-name num">{r.name}</Link>
        <span className="fa-meta">
          {r.role === "SP" ? t("sp") : t("rp")} · {hand}
          {r.status === "FA" && <span className="chip gold">{t("freeAgent")}</span>}
          {r.status !== "FA" && r.status !== "?" && <span className="chip" title={r.team_name ?? ""}>{t("onTeam")} {r.status}</span>}
        </span>
      </div>
      <p className="fa-why">{pitcherPhrase(t, lang, r, "home")}</p>
      <div className="fa-num">
        <span className="num">{fmt(r.stuff_home)}</span>
        <span className="fa-num-l">{t("stuffHome")}</span>
      </div>
      {!compact && (
        <div className="fa-actions">
          <Link to={`/y-si?p=${encodeURIComponent(r.pitcher_id)}`} className="btn" aria-label={`${t("tryWhatIf")} ${r.name}`}>{t("tryWhatIf")}</Link>
          <details className="fa-detail">
            <summary>{t("seeDetail")}</summary>
            <dl>
              <div><dt><Term k="stuff">{t("stuffNeutral")}</Term></dt><dd className="num">{fmt(r.stuff_neutral)}</dd></div>
              <div><dt>{t("altitudeDelta")}</dt><dd className="num">{signed(r.altitude_delta)}</dd></div>
              {r.fit != null && <div><dt><Term k="fit">{t("fit")}</Term></dt><dd className="num">{signed(r.fit)}</dd></div>}
              {r.best_pitch && <div><dt>{t("bestPitch")}</dt><dd>{pitchName(lang, r.best_pitch)} <span className="num faint">{fmt(r.best_pitch_stuff)}</span></dd></div>}
              <div><dt>{t("nPitches")}</dt><dd className="num">{r.n_pitches}</dd></div>
              <div><dt>{t("lastSeason")}</dt><dd className="num">{r.last_season}</dd></div>
            </dl>
          </details>
        </div>
      )}
    </li>
  );
}

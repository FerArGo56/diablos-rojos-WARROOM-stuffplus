import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type FreeAgentRow, type FreeAgents } from "../api";
import { useLang, type Key } from "../i18n";
import { pitchName, pitcherPhrase } from "../phrases";
import { fmt, signed, useApi, useAppState, useParkScale } from "../state";
import { FA_RULES, signingFor, type ParkScale, type SignVerdict } from "../verdicts";
import { Term } from "./Term";
import { Verdict } from "./Verdict";

const PAGE = 50;
const MAX = 500; // tope del API por consulta (backend: Query(50, le=500))
const SHAPE: Record<SignVerdict, string> = { sign: "up", watch: "dot", no: "down" };

type Filters = { status: string; role: "" | "SP" | "RP"; throws: "" | "Right" | "Left"; sort: "home" | "neutral" | "fit" };
type FullList = { rows: FreeAgentRow[]; total: number; medians: Record<string, number | null>; missing: number };

const SORT_KEY = { home: "stuff_home", neutral: "stuff_neutral", fit: "fit" } as const;

/** Escala del Harp Helú por rol: cada candidato se compara con los de su mismo rol. */
type RoleScales = { SP: ParkScale; RP: ParkScale };
const scaleOf = (s: RoleScales, r: { role: string }) => (r.role === "SP" ? s.SP : s.RP);

/** La lista completa, para poder filtrar por veredicto (se calcula en el frontend).
 *  Como el API entrega máximo 500 por consulta, se pide por rol × mano y se junta. */
function useFullList(f: Filters | null) {
  const [state, setState] = useState<{ data: FullList | null; error: boolean }>({ data: null, error: false });
  const [attempt, setAttempt] = useState(0);
  const key = f ? JSON.stringify(f) : null;
  useEffect(() => {
    if (!f) return;
    let alive = true;
    setState({ data: null, error: false });
    const roles = f.role ? [f.role] : ["SP", "RP"];
    const hands = f.throws ? [f.throws] : ["Right", "Left"];
    Promise.all(roles.flatMap((role) => hands.map((throws) =>
      api<FreeAgents>("/free-agents", { status: f.status, role, throws, sort: f.sort, limit: MAX }))))
      .then((parts) => {
        const k = SORT_KEY[f.sort];
        const rows = parts.flatMap((p) => p.rows).sort((a, b) => (b[k] ?? -Infinity) - (a[k] ?? -Infinity));
        const total = parts.reduce((n, p) => n + p.total, 0);
        if (alive) setState({ data: { rows, total, medians: parts[0]?.our_medians ?? {}, missing: total - rows.length }, error: false });
      })
      .catch(() => { if (alive) setState({ data: null, error: true }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);
  return { ...state, retry: () => setAttempt((n) => n + 1) };
}

export function FreeAgentTable({ compact = false }: { compact?: boolean }) {
  const { t } = useLang();
  const { meta } = useAppState();
  const teamsKnown = meta?.capabilities?.has_teams !== false || meta?.has_rosters === true;
  const [pickedStatus, setStatus] = useState<"fa" | "signed" | "all">(compact ? "fa" : "all");
  const status = teamsKnown ? pickedStatus : "all";   // sin equipos no hay forma de filtrar agentes libres
  const [role, setRole] = useState<"" | "SP" | "RP">("");
  const [throws, setThrows] = useState<"" | "Right" | "Left">("");
  const [pickedSort, setSort] = useState<"home" | "neutral" | "fit">("home");
  const [verdict, setVerdict] = useState<"" | SignVerdict>("");
  const homeId = meta?.home_stadium_id ?? "harp-helu";
  const homeSP = useParkScale(homeId, "SP");
  const homeRP = useParkScale(homeId, "RP");
  const home = useMemo(() => (homeSP && homeRP ? { SP: homeSP, RP: homeRP } : null), [homeSP, homeRP]);
  const [pages, setPages] = useState(1);

  const small = useApi<FreeAgents>(compact ? "/free-agents" : null, { status, role, throws, sort: pickedSort, limit: 6 });
  const full = useFullList(compact ? null : { status, role, throws, sort: pickedSort });
  const medians = compact ? small.data?.our_medians : full.data?.medians;
  const noStaff = !!medians && Object.values(medians).every((v) => v == null);
  const sort = noStaff && pickedSort === "fit" ? "home" : pickedSort;
  const error = compact ? small.error : full.error;
  const retry = compact ? small.retry : full.retry;

  const all = useMemo(() => (home ? (compact ? small.data?.rows : full.data?.rows) ?? null : null), [home, compact, small.data, full.data]);
  const counts = useMemo(() => {
    const c: Record<SignVerdict, number> = { sign: 0, watch: 0, no: 0 };
    if (home) for (const r of all ?? []) c[signingFor(r, scaleOf(home, r)).verdict]++;
    return c;
  }, [all, home]);
  const filtered = useMemo(() => (all && home && verdict ? all.filter((r) => signingFor(r, scaleOf(home, r)).verdict === verdict) : all), [all, home, verdict]);
  const shown = compact ? filtered : filtered?.slice(0, pages * PAGE);
  const reset = () => setPages(1);

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
      {!compact && (
        <div className="fa-verdicts" role="group" aria-label={t("verdictCol")}>
          <button type="button" className={verdict === "" ? "on" : ""} aria-pressed={verdict === ""} onClick={() => { setVerdict(""); reset(); }}>
            {t("faAll")} <span className="num">{all ? all.length : "…"}</span>
          </button>
          {(["sign", "watch", "no"] as const).map((v) => (
            <button key={v} type="button" className={`v-${v} ${verdict === v ? "on" : ""}`} aria-pressed={verdict === v} onClick={() => { setVerdict(v); reset(); }}>
              <span className={`v-shape ${SHAPE[v]}`} aria-hidden="true" />{t(`v_${v}` as Key)} <span className="num">{all ? counts[v] : "…"}</span>
            </button>
          ))}
        </div>
      )}
      <div className="fa-filters" role="group" aria-label={t("filters")}>
        {teamsKnown && (
          <div className="seg" role="group" aria-label={t("status")}>
            {(["fa", "signed", "all"] as const).map((s) => (
              <button key={s} type="button" className={status === s ? "on" : ""} aria-pressed={status === s} onClick={() => { setStatus(s); reset(); }}>{s === "fa" ? t("faOnly") : s === "signed" ? t("faSigned") : t("faAll")}</button>
            ))}
          </div>
        )}
        <div className="seg" role="group" aria-label={t("role")}>
          {(["", "SP", "RP"] as const).map((r) => <button key={r} type="button" className={role === r ? "on" : ""} aria-pressed={role === r} onClick={() => { setRole(r); reset(); }}>{r === "" ? t("any") : r === "SP" ? t("sp") : t("rp")}</button>)}
        </div>
        {!compact && (
          <>
            <div className="seg" role="group" aria-label={t("hand")}>
              {(["", "Right", "Left"] as const).map((h) => <button key={h} type="button" className={throws === h ? "on" : ""} aria-pressed={throws === h} onClick={() => { setThrows(h); reset(); }}>{h === "" ? t("any") : h === "Right" ? t("right") : t("left")}</button>)}
            </div>
            <label className="muted small fa-sort">{t("sortBy")}
              <select className="sel" value={sort} onChange={(e) => { setSort(e.target.value as typeof pickedSort); reset(); }}>
                <option value="home">{t("sortHome")}</option>
                <option value="neutral">{t("sortNeutral")}</option>
                {!noStaff && <option value="fit">{t("sortFit")}</option>}
              </select>
            </label>
          </>
        )}
      </div>
      {!compact && medians && (
        <p className="fa-rule">
          {noStaff
            ? t("faNoStaffNote", { n: FA_RULES.minPitches })
            : t("faRuleNote", { a: `+${FA_RULES.fitSign}` })}{" "}
          <Term k="stuff">{t("whatIsStuff")}</Term>
        </p>
      )}

      {error && <div className="empty-note"><p>{t("error")}</p><button type="button" className="btn" onClick={retry}>{t("retry")}</button></div>}
      {!shown && !error && <div className="skel skel-card" aria-busy="true" />}
      {shown && filtered && (
        <>
          <div className="fa-head" aria-hidden="true">
            <span>{t("verdictCol")}</span><span>{t("pitcher")}</span><span>{t("whyCol")}</span><span className="r">{t("stuffHome")}</span>{!compact && <span />}
          </div>
          <ul className="fa-list" aria-live="polite">
            {home && shown.map((r) => <FaRow key={r.pitcher_id} r={r} compact={compact} home={home} />)}
          </ul>
          {!compact && (
            <div className="fa-foot">
              <span className="faint small">
                {t("showing", { n: shown.length, total: filtered.length })}
                {full.data && full.data.missing > 0 && <> · {t("faMissing", { n: full.data.missing, max: MAX })}</>}
              </span>
              {shown.length < filtered.length && (
                <button type="button" className="btn" onClick={() => setPages((n) => n + 1)}>{t("showMore")}</button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FaRow({ r, compact, home }: { r: FreeAgentRow; compact: boolean; home: RoleScales }) {
  const { t, lang } = useLang();
  const s = signingFor(r, scaleOf(home, r));
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

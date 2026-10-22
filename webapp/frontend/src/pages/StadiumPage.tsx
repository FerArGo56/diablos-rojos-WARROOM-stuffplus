import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { LeaderRow, Projection, StadiumDetail } from "../api";
import { CountUp } from "../components/CountUp";
import { CrownIcon, Leaderboard } from "../components/Leaderboard";
import { MovementPlot } from "../components/MovementPlot";
import { SearchBox } from "../components/SearchBox";
import { StrikeZone } from "../components/StrikeZone";
import { Term } from "../components/Term";
import { Verdict } from "../components/Verdict";
import { PITCH_NAMES, fmtInt, useLang } from "../i18n";
import { leaguePitchEffect, parkPhrase, pitchPhrase, pitcherPhrase, vsSea } from "../phrases";
import { PITCH_COLORS, altitudeColor, fmt, signed, useApi, useAppState, useParkScale } from "../state";
import { verdictFor } from "../verdicts";

export default function StadiumPage() {
  const { id = "" } = useParams();
  const { t, lang } = useLang();
  const { meta } = useAppState();
  const [params, setParams] = useSearchParams();
  const pid = params.get("p");
  const [aim, setAim] = useState({ x: 0, z: 2.5 });
  const [crown, setCrown] = useState(false);
  const { data: st, error, retry } = useApi<StadiumDetail>(`/stadiums/${id}`);
  const { data: top } = useApi<{ rows: LeaderRow[] }>(`/stadiums/${id}/leaderboard`, { limit: 3 });
  const { data: proj } = useApi<Projection>(pid ? `/stadiums/${id}/pitchers/${pid}` : null, { aim_x: aim.x, aim_z: aim.z });
  const scale = useParkScale(id);
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const projPid = proj?.pitcher.pitcher_id;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (proj) setVisible(new Set(proj.pitches.map((p) => p.pitch_type))); }, [projPid]);
  // Sin lanzador elegido, el #1 del parque ya viene seleccionado.
  useEffect(() => {
    if (!pid && top?.rows[0]) setParams({ p: top.rows[0].pitcher_id }, { replace: true });
  }, [pid, top, setParams]);
  const pickPitcher = (p: string) => setParams({ p });
  const closeCrown = useCallback(() => setCrown(false), []);

  if (error) return <main className="page"><div className="empty-note"><p>{t("error")}</p><button type="button" className="btn" onClick={retry}>{t("retry")}</button></div></main>;
  if (!st) return <main className="page" aria-busy="true"><div className="skel skel-bug" /><div className="skel skel-card" /></main>;
  const toggle = (pt: string) => setVisible((v) => { const n = new Set(v); if (n.has(pt)) n.delete(pt); else n.add(pt); return n; });
  const where = id === meta?.home_stadium_id ? "home" : "here";
  const ready = proj && proj.pitcher.pitcher_id === pid ? proj : null;
  const p = ready?.pitcher;

  return (
    <main className="page stadium">
      <Link to="/explorar" className="muted small back-link">← {t("backToMap")}</Link>
      <section className="stadium-hero">
        <div>
          <div className="eyebrow">{st.team_name} · {st.zone === "Norte" ? t("zoneNorte") : t("zoneSur")}</div>
          <h1>{st.venue_name}</h1>
          <p className="lede">{parkPhrase(t, lang, st)}</p>
          <div className="stats-row">
            <div className="stat"><span className="v score" style={{ color: altitudeColor(st.altitude_m) }}><CountUp value={st.altitude_m} format={(v) => fmtInt(lang, v)} /><span className="sb-unit"> m</span></span><span className="l">{t("altitude")} · {st.city}</span></div>
            <div className="stat"><span className="v score"><CountUp value={st.movement_retained_pct} format={(v) => fmt(v, 0)} /><span className="sb-unit">%</span></span><span className="l">{t("movementRetained")} {t("vsSeaLevel")}</span></div>
          </div>
        </div>
        <button type="button" className="crown-btn" onClick={() => setCrown(true)}><CrownIcon size={26} /> {t("crownTitle")}</button>
      </section>

      <section aria-labelledby="best-here">
        <h2 id="best-here" className="section-label">{t("bestHereShort")}</h2>
        <p className="muted small hint"><Term k="verdict">{t("whatIsVerdict")}</Term></p>
        {top ? (
          <div className="best-pick" role="group" aria-labelledby="best-here">
            {top.rows.map((r) => (
              <button key={r.pitcher_id} type="button" className={`best-card ${pid === r.pitcher_id ? "on" : ""}`} aria-pressed={pid === r.pitcher_id} onClick={() => pickPitcher(r.pitcher_id)}>
                <span className="best-top"><span className="pick-rank num">{r.rank}</span><Verdict kind={verdictFor(r.stuff_plus, scale)} size="sm" /><span className="num faint">{fmt(r.stuff_plus)}</span></span>
                <span className="best-name num">{r.name}</span>
                <span className="best-why">{pitcherPhrase(t, lang, r, where)}</span>
              </button>
            ))}
          </div>
        ) : <div className="skel skel-line" />}
        <div className="stadium-search"><SearchBox pitchersOnly onPickPitcher={pickPitcher} placeholder={t("pickPitcher") + "…"} /></div>
      </section>

      {pid && !ready && <div className="skel skel-card" aria-busy="true" />}
      {ready && p && (
        <>
          <section className="panel sel-pitcher" aria-labelledby="sel-name">
            <div>
              <div className="eyebrow">{p.role === "SP" ? t("sp") : t("rp")} · {p.throws === "Right" ? t("right") : t("left")}</div>
              <h2 id="sel-name" className="num">{p.name}</h2>
              <Link to={`/lanzador/${pid}`} className="muted small wi-profile">{t("profileLink")} →</Link>
            </div>
            <div className="wi-score">
              <Verdict kind={verdictFor(p.stuff_here, scale)} size="lg" />
              <p className="wi-line"><span className="num">{fmt(p.stuff_here)}</span> <Term k="stuff">Stuff+</Term> {t("here")}
</p>
              <p className="wi-sea">{vsSea(p.stuff_here, p.stuff_sea) === 0 ? t("sameAsSea") : vsSea(p.stuff_here, p.stuff_sea) != null && <><span className="num">{signed(vsSea(p.stuff_here, p.stuff_sea))}</span> {t("wiVsSea")}</>}</p>
            </div>
            <ul className="wi-phrases sel-phrases">
              {[...ready.pitches].sort((a, b) => b.usage - a.usage).map((x) => (
                <li key={x.pitch_type}>
                  <span className="dot" style={{ background: PITCH_COLORS[x.pitch_type] }} aria-hidden="true" />
                  <span>{pitchPhrase(t, lang, x.pitch_type, x.sea, x.here)}.</span>
                  <span className="faint num small">{fmt(x.usage, 0)}%</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="pt-legend" role="group" aria-label={t("pitches")}>
            {ready.pitches.map((x) => (
              <button key={x.pitch_type} type="button" className={visible.has(x.pitch_type) ? "on" : ""} aria-pressed={visible.has(x.pitch_type)} onClick={() => toggle(x.pitch_type)}>
                <span className="dot" style={{ background: PITCH_COLORS[x.pitch_type] }} /> {PITCH_NAMES[lang][x.pitch_type]} <span className="faint num">{fmt(x.usage, 0)}%</span>
              </button>
            ))}
          </div>

          <div className="stadium-grid">
            <section className="panel zone-panel">
              <div className="panel-head"><h3>{t("strikeZoneTitle")}</h3><span className="faint tiny">{t("aimHint")}</span></div>
              <StrikeZone pitches={ready.pitches} visible={visible} aim={aim} onAim={(x, z) => setAim({ x, z })} labels={{ sea: t("seaLevel"), here: st.venue_name, aim: `${t("strikeZoneTitle")}. ${t("aimHint")}` }} />
            </section>
            <section className="panel">
              <div className="panel-head"><h3>{t("movementTitle")}</h3></div>
              <MovementPlot pitches={ready.pitches} visible={visible} xLabel={t("hb")} yLabel={t("ivb")} label={t("movementTitle")} />
              <details className="tech">
                <summary>{t("seeDetail")}</summary>
                <div className="table-wrap">
                  <table className="data">
                    <thead><tr>
                      <th scope="col"><span className="visually-hidden">{t("pitches")}</span></th><th scope="col" className="r">{t("velo")}</th><th scope="col" className="r"><Term k="ivb">{t("ivbShort")}</Term></th><th scope="col" className="r"><Term k="hb">{t("hbShort")}</Term></th>
                      <th scope="col" className="r">{t("plateSpeed")}</th><th scope="col" className="r"><Term k="stuff">Stuff+</Term></th>
                    </tr></thead>
                    <tbody>
                      {ready.pitches.filter((x) => visible.has(x.pitch_type)).map((x) => (
                        <tr key={x.pitch_type}>
                          <th scope="row"><span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><span className="dot" style={{ background: PITCH_COLORS[x.pitch_type] }} />{PITCH_NAMES[lang][x.pitch_type]}</span>
                            <div className="faint tiny">{t("missBy", fmt(x.miss_inches))}</div></th>
                          <td className="r num">{fmt(x.rel_speed)}</td>
                          <td className="r num">{fmt(x.here.ivb)}<div className="faint tiny">{fmt(x.sea.ivb)}</div></td>
                          <td className="r num">{fmt(x.here.hb)}<div className="faint tiny">{fmt(x.sea.hb)}</div></td>
                          <td className="r num">{fmt(x.here.plate_speed)}<div className="faint tiny">{fmt(x.sea.plate_speed)}</div></td>
                          <td className="r num">{fmt(x.here.stuff_plus)}<div className="faint tiny">{signed(x.here.stuff_plus - x.sea.stuff_plus)}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="faint tiny">{t("here")} / {t("seaLevel")} · in, mph</p>
                </div>
              </details>
            </section>
          </div>
        </>
      )}

      <section className="panel" aria-labelledby="league-here">
        <h2 id="league-here" className="section-label">{t("leagueHere")}</h2>
        <ul className="league-effect">
          {st.league_by_pitch_type.map((r) => {
            const e = leaguePitchEffect(t, lang, r);
            return (
              <li key={r.pitch_type}>
                <span className="le-name"><span className="dot" style={{ background: PITCH_COLORS[r.pitch_type] }} aria-hidden="true" />{PITCH_NAMES[lang][r.pitch_type]}</span>
                <span className="le-text">{e.text}</span>
                <span className="le-bar" role="img" aria-label={t("lp_keeps", { n: e.keptPct })}>
                  <span className="le-fill" style={{ width: `${Math.min(100, e.keptPct)}%`, background: PITCH_COLORS[r.pitch_type] }} />
                </span>
                <span className="le-pct num">{e.keptPct}%</span>
              </li>
            );
          })}
        </ul>
        <p className="faint tiny">{t("leNote")}</p>
      </section>

      {crown && <Leaderboard stadiumId={id} venueName={st.venue_name} onClose={closeCrown} />}
    </main>
  );
}

import { useId, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Profile, Projection, Stadium } from "../api";
import { Term } from "../components/Term";
import { Verdict } from "../components/Verdict";
import { PITCH_NAMES, fmtDate, fmtInt, useLang } from "../i18n";
import { PARK_SPREAD_MIN, pitchPhrase } from "../phrases";
import { PITCH_COLORS, altitudeColor, fmt, stuffColor, useApi, useAppState } from "../state";
import { verdictFor } from "../verdicts";

export default function PitcherPage() {
  const { id = "" } = useParams();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { meta } = useAppState();
  const parkSel = useId();
  const home = meta?.home_stadium_id ?? "harp-helu";
  const [season, setSeason] = useState<number | undefined>(undefined);
  const { data, error, retry } = useApi<Profile>(`/pitchers/${id}`, { season });
  const { data: stadiums } = useApi<Stadium[]>("/stadiums");
  const { data: atHome } = useApi<Projection>(`/stadiums/${home}/pitchers/${id}`);

  if (error) return <main className="page"><div className="empty-note"><p>{t("error")}</p><button type="button" className="btn" onClick={retry}>{t("retry")}</button></div></main>;
  if (!data) return <main className="page" aria-busy="true"><div className="skel skel-bug" /><div className="skel skel-card" /></main>;
  const p = data.pitcher;
  const ours = p.status === meta?.our_team_code;
  const center = p.stuff_neutral ?? 100;
  const spread = Math.max(1, ...data.by_park.map((b) => Math.abs(b.stuff_plus - center)));
  const bayes = !!p.bayes_available;
  const ranked = [...data.by_park].sort((a, b) => b.stuff_plus - a.stuff_plus);
  const homeRow = data.by_park.find((b) => b.stadium_id === home);
  const homeStuff = homeRow?.stuff_plus ?? p.stuff_home ?? null;

  return (
    <main className="page pitcher">
      <Link to="/explorar" className="muted small back-link">← {t("backToMap")}</Link>
      <section className="pitcher-hero">
        <div>
          <div className="eyebrow">{p.role === "SP" ? t("sp") : t("rp")} · {p.throws === "Right" ? t("right") : t("left")}</div>
          <h1 className="num">{p.name}</h1>
          <div className="pitcher-chips">
            {p.status === "FA" ? <span className="chip gold">{t("freeAgent")}</span> : p.status === "?" ? null : <span className={`chip ${ours ? "red" : ""}`}>{ours ? t("ours") : `${t("onTeam")} ${p.status}`}</span>}
            {p.team_name && <span className="chip">{p.season}: {p.team_name}</span>}
            <span className="chip num">{p.n_pitches} {t("pitches").toLowerCase()}{p.games ? ` · ${p.games} ${t("games").toLowerCase()}` : ""}</span>
          </div>
          <div className="pitcher-actions">
            <Link to={`/y-si?p=${encodeURIComponent(p.pitcher_id)}`} className="btn primary">{t("tryWhatIf")}</Link>
            {p.seasons.length > 1 && (
              <div className="seg" role="group" aria-label={t("season")}>{p.seasons.map((s) => <button key={s} type="button" className={p.season === s ? "on" : ""} aria-pressed={p.season === s} onClick={() => setSeason(s)}>{s}</button>)}</div>
            )}
            <label htmlFor={parkSel} className="visually-hidden">{t("viewInStadium")}</label>
            <select id={parkSel} className="sel" value="" onChange={(e) => e.target.value && navigate(`/estadio/${e.target.value}?p=${p.pitcher_id}`)}>
              <option value="">{t("viewInStadium")}…</option>
              {stadiums?.map((s) => <option key={s.id} value={s.id}>{s.venue_name} ({fmtInt(lang, s.altitude_m)} m)</option>)}
            </select>
          </div>
        </div>

        <aside className="decision panel" aria-label={t("atHome")}>
          <div className="small muted">{t("atHome")}</div>
          <Verdict kind={verdictFor(homeStuff)} size="lg" />
          <div className="small muted"><span className="num">{fmt(homeStuff)}</span> <Term k="stuff">Stuff+</Term></div>
          {ranked.length >= 6 && ranked[0].stuff_plus - ranked[ranked.length - 1].stuff_plus < PARK_SPREAD_MIN && (
            <p className="small use-avoid-same">{t("parksSimilar", { n: ranked.length, a: fmt(ranked[ranked.length - 1].stuff_plus), b: fmt(ranked[0].stuff_plus) })}</p>
          )}
          {ranked.length >= 6 && ranked[0].stuff_plus - ranked[ranked.length - 1].stuff_plus >= PARK_SPREAD_MIN && (
            <dl className="use-avoid">
              <div><dt><span className="v-good"><span className="v-shape up" aria-hidden="true" /></span>{t("useAt")}</dt>
                <dd>{ranked.slice(0, 3).map((b) => <Link key={b.stadium_id} to={`/estadio/${b.stadium_id}?p=${p.pitcher_id}`}>{b.venue_name.replace(/^Estadio /, "")} <span className="num faint">{fmt(b.stuff_plus)}</span></Link>)}</dd></div>
              <div><dt><span className="v-avoid"><span className="v-shape down" aria-hidden="true" /></span>{t("avoidAt")}</dt>
                <dd>{ranked.slice(-3).reverse().map((b) => <Link key={b.stadium_id} to={`/estadio/${b.stadium_id}?p=${p.pitcher_id}`}>{b.venue_name.replace(/^Estadio /, "")} <span className="num faint">{fmt(b.stuff_plus)}</span></Link>)}</dd></div>
            </dl>
          )}
        </aside>
      </section>

      <section className="panel" aria-labelledby="arsenal-title">
        <h2 id="arsenal-title" className="section-label">{t("profileArsenal")} {p.season} · {t("altitudeHere")}</h2>
        {atHome ? (
          <ul className="wi-phrases">
            {[...atHome.pitches].sort((a, b) => b.usage - a.usage).map((x) => (
              <li key={x.pitch_type}>
                <span className="dot" style={{ background: PITCH_COLORS[x.pitch_type] }} aria-hidden="true" />
                <span>{pitchPhrase(t, lang, x.pitch_type, x.sea, x.here)}.</span>
                <span className="faint num small">{fmt(x.usage, 0)}%</span>
              </li>
            ))}
          </ul>
        ) : <div className="skel skel-line" />}
        <details className="tech">
          <summary>{t("seeDetail")}</summary>
          <div className="table-wrap">
            <table className="data">
              <thead><tr>
                <th scope="col"><span className="visually-hidden">{t("pitches")}</span></th><th scope="col" className="r">{t("usage")}</th><th scope="col" className="r">{t("velo")}</th><th scope="col" className="r">{t("spin")}</th>
                <th scope="col" className="r"><Term k="ivb">{t("ivbShort")}</Term></th><th scope="col" className="r"><Term k="hb">{t("hbShort")}</Term></th><th scope="col" className="r"><Term k="whiff">{t("whiffShort")}</Term></th>
                {bayes && <th scope="col" className="r"><Term k="whiff">{t("bayesWhiff")}</Term><br /><span className="faint tiny">{t("bayesWhiffSub")}</span></th>}
                <th scope="col" className="r"><Term k="stuff">Stuff+</Term> {t("neutral")}</th><th scope="col" className="r">{t("bestPark")}</th><th scope="col" className="r">{t("worstPark")}</th>
              </tr></thead>
              <tbody>
                {data.arsenal.map((a) => (
                  <tr key={a.pitch_type}>
                    <th scope="row"><span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><span className="dot" style={{ background: PITCH_COLORS[a.pitch_type] }} />{PITCH_NAMES[lang][a.pitch_type]}</span></th>
                    <td className="r num">{fmt(a.usage, 0)}%</td>
                    <td className="r num">{fmt(a.rel_speed)}</td>
                    <td className="r num">{fmt(a.spin_rate, 0)}</td>
                    <td className="r num">{fmt(a.ivb_sea)}</td>
                    <td className="r num">{fmt(a.hb_sea)}</td>
                    <td className="r num">{a.whiff_pct == null ? "–" : `${fmt(a.whiff_pct, 0)}%`}</td>
                    {bayes && (
                      <td className="r num">
                        {a.bayes_whiff_sea == null ? "–" : <>{fmt(a.bayes_whiff_sea)}% <span className="faint">→</span> <strong>{fmt(a.bayes_whiff_home)}%</strong></>}
                      </td>
                    )}
                    <td className="r num">{fmt(a.stuff_neutral)}</td>
                    <td className="r num">{fmt(a.stuff_best_park)}</td>
                    <td className="r num">{fmt(a.stuff_worst_park)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="faint tiny">{t("ivbShort")} / {t("hbShort")}: {t("seaLevel")}, in{bayes ? ` · ${t("bayesFoot")}` : ""}</p>
          </div>
        </details>
      </section>

      <div className="stadium-grid">
        <section className="panel" aria-labelledby="bypark-title">
          <h2 id="bypark-title" className="section-label">{t("profileByPark")}</h2>
          {data.by_park.map((b) => {
            const pct = (v: number) => 50 + ((v - center) / spread) * 48;
            const xv = pct(b.stuff_plus);
            return (
              <Link to={`/estadio/${b.stadium_id}?p=${p.pitcher_id}`} key={b.stadium_id} className="bar-row">
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span className="dot" style={{ background: altitudeColor(b.altitude_m), marginRight: 6 }} />{b.team_code} <span className="faint num">{fmtInt(lang, b.altitude_m)} m</span>
                </span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ left: `${Math.min(50, xv)}%`, width: `${Math.abs(xv - 50)}%`, background: stuffColor(b.stuff_plus), opacity: 0.85 }} />
                  <div className="bar-mid" style={{ left: "50%" }} />
                </div>
                <span className="num" style={{ textAlign: "right" }}>{fmt(b.stuff_plus)}</span>
              </Link>
            );
          })}
        </section>
        <section className="panel" aria-labelledby="workload-title">
          <h2 id="workload-title" className="section-label">{t("profileWorkload")}</h2>
          {data.workload.length === 0 ? <p className="muted small">{t("workloadUnknown")}</p> : <WorkloadChart workload={data.workload} stadiums={stadiums} />}
        </section>
      </div>
    </main>
  );
}

/** Pitcheos por salida, con eje, unidades y leyenda; el color es la altitud del parque. */
function WorkloadChart({ workload, stadiums }: { workload: Profile["workload"]; stadiums: Stadium[] | null }) {
  const { t, lang } = useLang();
  const W = 600, H = 200, L = 34, B = 26, T = 8;
  const max = Math.max(1, ...workload.map((w) => w.pitches));
  const step = (W - L) / workload.length;
  const y = (v: number) => H - B - (v / max) * (H - B - T);
  const ticks = [0, Math.round(max / 2), max];
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img"
        aria-label={`${t("workloadAxis")}: ${workload.length} · max ${max}`}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted)" fontFamily="var(--mono)">{v}</text>
          </g>
        ))}
        {workload.map((w, i) => {
          const s = stadiums?.find((x) => x.id === w.stadium_id);
          return (
            <rect key={i} x={L + i * step + step * 0.15} y={y(w.pitches)} width={step * 0.7} height={H - B - y(w.pitches)} rx={2} fill={s ? altitudeColor(s.altitude_m) : "var(--muted)"}>
              <title>{`${fmtDate(lang, w.date)} · ${w.pitches} · ${s?.venue_name ?? ""}`}</title>
            </rect>
          );
        })}
        <text x={L} y={H - 6} fontSize="11" fill="var(--muted)">{fmtDate(lang, workload[0].date, { day: "numeric", month: "short" })}</text>
        <text x={W} y={H - 6} fontSize="11" fill="var(--muted)" textAnchor="end">{fmtDate(lang, workload[workload.length - 1].date, { day: "numeric", month: "short" })}</text>
      </svg>
      <p className="faint tiny">{t("workloadAxis")} · {t("workloadLegend")}</p>
    </>
  );
}

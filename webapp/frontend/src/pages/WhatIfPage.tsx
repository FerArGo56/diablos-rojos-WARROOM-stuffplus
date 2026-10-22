import { useId } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { FreeAgents, LeaderRow, Projection, Stadium } from "../api";
import { MovementPlot } from "../components/MovementPlot";
import { SearchBox } from "../components/SearchBox";
import { Term } from "../components/Term";
import { Verdict } from "../components/Verdict";
import { fmtInt, useLang } from "../i18n";
import { pitchName, pitchPhrase } from "../phrases";
import { PITCH_COLORS, fmt, signed, useApi, useAppState } from "../state";
import { verdictFor } from "../verdicts";

/** ¿Y si…? modo 1: un lanzador real en cualquier parque, con los endpoints que ya existen. */
export default function WhatIfPage() {
  const { t, lang } = useLang();
  const { meta } = useAppState();
  const parkId = useId();
  const [params, setParams] = useSearchParams();
  const home = meta?.home_stadium_id ?? "harp-helu";
  const pid = params.get("p");
  const sid = params.get("s") ?? home;
  const update = (next: Record<string, string>, replace = false) => {
    const q = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) q.set(k, v);
    setParams(q, { replace });
  };

  const { data: stadiums } = useApi<Stadium[]>("/stadiums");
  const { data: proj, error, retry } = useApi<Projection>(pid ? `/stadiums/${sid}/pitchers/${pid}` : null);
  const { data: top } = useApi<{ rows: LeaderRow[] }>(pid ? null : `/stadiums/${sid}/leaderboard`, { limit: 3 });
  const { data: fa } = useApi<FreeAgents>(pid ? "/free-agents" : null, { limit: 1 });
  const parks = stadiums ? [...stadiums].sort((a, b) => b.altitude_m - a.altitude_m) : [];
  const ready = proj && proj.pitcher.pitcher_id === pid && proj.stadium.id === sid ? proj : null;

  return (
    <main className="page wi">
      <h1>{t("wiTitle")}</h1>
      <p className="muted lede">{t("wiHint")}</p>

      <section className="wi-controls panel" aria-label={t("pickPitcher")}>
        <SearchBox pitchersOnly onPickPitcher={(p) => update({ p })} placeholder={t("pickPitcher") + "…"} />
        <label htmlFor={parkId} className="wi-park">
          <span className="small muted">{t("wiPark")}</span>
          <select id={parkId} className="sel" value={sid} onChange={(e) => update({ s: e.target.value }, true)}>
            {parks.map((s) => <option key={s.id} value={s.id}>{s.venue_name} ({fmtInt(lang, s.altitude_m)} m)</option>)}
          </select>
        </label>
      </section>

      {!pid && (
        <section className="wi-start">
          <p className="muted">{t("wiPickHint")}</p>
          {top ? (
            <div className="wi-quick">
              {top.rows.map((r) => (
                <button key={r.pitcher_id} type="button" className="btn" onClick={() => update({ p: r.pitcher_id })}>
                  <span className="num">{r.name}</span> <Verdict kind={verdictFor(r.stuff_plus)} size="sm" />
                </button>
              ))}
            </div>
          ) : <div className="skel skel-line" />}
        </section>
      )}

      {pid && error && <div className="empty-note"><p>{t("error")}</p><button type="button" className="btn" onClick={retry}>{t("retry")}</button></div>}
      {pid && !error && !ready && <div className="skel skel-card" aria-busy="true" />}
      {ready && <Result proj={ready} fa={fa} isHome={sid === home} onHome={() => update({ s: home }, true)} />}
    </main>
  );
}

function Result({ proj, fa, isHome, onHome }: { proj: Projection; fa: FreeAgents | null; isHome: boolean; onHome: () => void }) {
  const { t, lang } = useLang();
  const p = proj.pitcher;
  const here = p.stuff_here ?? null;
  const sea = p.stuff_sea ?? null;
  const pitches = [...proj.pitches].sort((a, b) => b.usage - a.usage);
  const visible = new Set(pitches.map((x) => x.pitch_type));
  const median = fa?.our_medians[p.role] ?? null;

  return (
    <>
      {/* 1. veredicto en ese parque */}
      <section className="wi-verdict panel" aria-labelledby="wi-name">
        <div className="wi-who">
          <div className="eyebrow">{p.role === "SP" ? t("sp") : t("rp")} · {p.throws === "Right" ? t("right") : t("left")}</div>
          <h2 id="wi-name" className="num">{p.name}</h2>
          <Link to={`/lanzador/${p.pitcher_id}`} className="small muted wi-profile">{t("profileLink")} →</Link>
        </div>
        <div className="wi-score">
          <Verdict kind={verdictFor(here)} size="lg" />
          <p className="wi-line">
            {t("wiStuffLine", { n: fmt(here), park: proj.stadium.venue_name })}
            {here != null && sea != null && <> · <span className="num">{t("wiVsSea", { d: signed(here - sea) })}</span></>}
          </p>
          <p className="faint small"><Term k="stuff">{t("whatIsStuff")}</Term></p>
        </div>
      </section>

      {/* 2. una frase por pitcheo */}
      <section aria-labelledby="wi-pitches">
        <h2 id="wi-pitches" className="section-label">{t("wiPitches")}</h2>
        <ul className="wi-phrases">
          {pitches.map((x) => (
            <li key={x.pitch_type}>
              <span className="dot" style={{ background: PITCH_COLORS[x.pitch_type] }} aria-hidden="true" />
              <span>{pitchPhrase(t, lang, x.pitch_type, x.sea, x.here)}.</span>
              <span className="faint num small">{fmt(x.usage, 0)}%</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="wi-grid">
        {/* 3. mapa de movimiento */}
        <section className="panel" aria-labelledby="wi-move">
          <h2 id="wi-move" className="section-label">{t("wiMovement")}</h2>
          <MovementPlot pitches={pitches} visible={visible} xLabel={t("hb")} yLabel={t("ivb")} label={t("wiMovement")} />
          <div className="wi-legend small muted">
            <span><span className="lg-ring" aria-hidden="true" /> {t("wiLegendSea")}</span>
            <span><span className="lg-fill" aria-hidden="true" /> {t("wiLegendHere")}</span>
          </div>
        </section>

        {/* 4. números */}
        <section className="panel" aria-labelledby="wi-nums">
          <h2 id="wi-nums" className="section-label">{t("wiNumbers")}</h2>
          <div className="table-wrap">
            <table className="data">
              <thead><tr>
                <th scope="col"><span className="visually-hidden">{t("pitches")}</span></th>
                <th scope="col" className="r">{t("usage")}</th>
                <th scope="col" className="r"><Term k="ivb">{t("ivbShort")}</Term></th>
                <th scope="col" className="r"><Term k="hb">{t("hbShort")}</Term></th>
                <th scope="col" className="r"><Term k="stuff">Stuff+</Term></th>
              </tr></thead>
              <tbody>
                {pitches.map((x) => (
                  <tr key={x.pitch_type}>
                    <th scope="row" style={{ textAlign: "left", fontWeight: 500 }}>
                      <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><span className="dot" style={{ background: PITCH_COLORS[x.pitch_type] }} aria-hidden="true" />{pitchName(lang, x.pitch_type)}</span>
                    </th>
                    <td className="r num">{fmt(x.usage, 0)}%</td>
                    <td className="r num">{fmt(x.sea.ivb)} → <strong>{fmt(x.here.ivb)}</strong></td>
                    <td className="r num">{fmt(x.sea.hb)} → <strong>{fmt(x.here.hb)}</strong></td>
                    <td className="r num">{fmt(x.sea.stuff_plus)} → <strong>{fmt(x.here.stuff_plus)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="faint tiny">{t("seaShort")} → {t("hereShort")} · in</p>
        </section>
      </div>

      {/* 5. contra nuestro staff */}
      <section className="wi-staff" aria-labelledby="wi-staff">
        <h2 id="wi-staff" className="section-label">{t("wiStaff")}</h2>
        {median == null ? <p className="muted">{t("wiStaffNone")}</p>
          : !isHome ? <button type="button" className="btn" onClick={onHome}>{t("stuffHome")}</button>
          : here != null && <p>{t("wiStaffLine", { d: signed(here - median), r: t(p.role === "SP" ? "rolePluralSP" : "rolePluralRP") })}</p>}
      </section>
    </>
  );
}

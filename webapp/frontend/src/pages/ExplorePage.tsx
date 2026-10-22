import { useCallback, useState } from "react";
import type { Stadium } from "../api";
import { FreeAgentTable } from "../components/FreeAgentTable";
import { MexicoMap } from "../components/MexicoMap";
import { ScheduleCalendar } from "../components/ScheduleCalendar";
import { SearchBox } from "../components/SearchBox";
import { Link } from "react-router-dom";
import { fmtInt, useLang } from "../i18n";
import { altitudeColor, useApi } from "../state";

export default function ExplorePage() {
  const { t, lang } = useLang();
  const { data: stadiums } = useApi<Stadium[]>("/stadiums");
  const [highlight, setHighlight] = useState<string | null>(null);
  const onHighlight = useCallback((id: string | null) => setHighlight(id), []);
  const alt = stadiums ? [...stadiums].sort((a, b) => b.altitude_m - a.altitude_m) : [];

  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">Liga Mexicana de Beisbol · Stuff+</div>
          <h1>{t("mapTitle")}</h1>
          <p>{t("tagline")}</p>
        </div>
        <div style={{ width: "min(460px, 100%)" }}><SearchBox /></div>
      </section>
      <div className="home-grid">
        <section className="panel">
          {stadiums ? <MexicoMap stadiums={stadiums} highlightId={highlight} /> : <div className="skel skel-card" aria-busy="true" />}
          {alt.length > 0 && (
            <details className="tech park-list">
              <summary>{t("parksList")}</summary>
              <ol>
                {alt.map((s) => (
                  <li key={s.id}><Link to={`/estadio/${s.id}`}><span className="dot" style={{ background: altitudeColor(s.altitude_m) }} aria-hidden="true" /><span>{s.venue_name}</span><span className="faint small">{s.city}</span><span className="num">{fmtInt(lang, s.altitude_m)} m</span></Link></li>
                ))}
              </ol>
            </details>
          )}
          {alt.length > 0 && (
            <div className="stats-row" style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <div className="stat"><span className="v num">{fmtInt(lang, alt[0].altitude_m)} m</span><span className="l">{alt[0].team_code} · {t("altitude")}</span></div>
              <div className="stat"><span className="v num">{fmtInt(lang, alt[alt.length - 1].altitude_m)} m</span><span className="l">{alt[alt.length - 1].team_code} · {t("altitude")}</span></div>
              <div className="stat"><span className="v num" style={{ color: "var(--red-2)" }}>{Math.round(100 - alt[0].movement_retained_pct)}%</span><span className="l">{alt[0].team_code} · {t("movementLost")}</span></div>
            </div>
          )}
        </section>
        <div className="home-side">
          <ScheduleCalendar onHighlight={onHighlight} />
        </div>
        <div className="home-fa"><FreeAgentTable compact /></div>
      </div>
    </main>
  );
}

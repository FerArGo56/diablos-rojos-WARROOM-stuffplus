import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Bullpen, Game, LeaderRow, Schedule, StadiumDetail } from "../api";
import { BullpenList } from "../components/BullpenList";
import { CountUp } from "../components/CountUp";
import { Diablo } from "../components/Diablo";
import { Term } from "../components/Term";
import { Verdict } from "../components/Verdict";
import { fmtDate, fmtInt, useLang, type Key } from "../i18n";
import { parkPhrase, pitcherPhrase } from "../phrases";
import { altitudeColor, fmt, useApi, useAppState, useParkScale } from "../state";
import { verdictFor } from "../verdicts";

const localToday = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD en la zona del usuario

/** Los juegos seguidos contra el mismo rival en el mismo parque que el juego dado. */
function seriesOf(games: Game[], date: string): Game[] {
  const i = games.findIndex((g) => g.date === date);
  if (i < 0) return [];
  const same = (g: Game) => g.opponent_code === games[i].opponent_code && g.stadium_id === games[i].stadium_id;
  let a = i, b = i;
  while (a > 0 && same(games[a - 1])) a--;
  while (b < games.length - 1 && same(games[b + 1])) b++;
  return games.slice(a, b + 1).filter((g, k, arr) => k === 0 || arr[k - 1].date !== g.date);
}

export default function TodayPage() {
  const { t, lang } = useLang();
  const { meta, selectedDate, setSelectedDate } = useAppState();
  const { data: bp, error, retry } = useApi<Bullpen>("/bullpen", { on: selectedDate ?? undefined });
  const { data: sched, retry: retrySched } = useApi<Schedule>("/schedule");
  const sid = bp?.available ? bp.stadium.id : null;
  const { data: st, retry: retrySt } = useApi<StadiumDetail>(sid ? `/stadiums/${sid}` : null);
  const { data: top, retry: retryTop } = useApi<{ rows: LeaderRow[] }>(sid ? `/stadiums/${sid}/leaderboard` : null, { limit: 3 });
  const refresh = useCallback(() => { retry(); retrySched(); retrySt(); retryTop(); }, [retry, retrySched, retrySt, retryTop]);
  const { indicator, busy } = usePullToRefresh(refresh);
  const scale = useParkScale(sid);

  const date = bp?.games[0]?.date ?? bp?.as_of ?? null;
  const games = sched?.games ?? [];
  const series = useMemo(() => (date ? seriesOf(games, date) : []), [games, date]);
  const played = games.find((g) => g.date === date && g.result);

  if (error) return <main className="page today"><EmptyNote text={t("error")} onRetry={retry} /></main>;
  if (bp && !bp.available) return <main className="page today"><EmptyNote text={t("noSchedule")} /></main>;
  if (!bp || !date) return <main className="page today" aria-busy="true"><div className="skel skel-bug" /><div className="skel skel-line" /><div className="skel skel-card" /></main>;

  const today = localToday();
  const isLast = games.length > 0 && date === games[games.length - 1].date;
  const label: Key | null = date === today ? "gameToday" : date > today ? "gameNext" : isLast ? "gameLast" : null;
  const home = bp.games[0]?.home ?? false;
  const us = meta?.our_team_code ?? "MEX";
  const alt = bp.stadium.altitude_m;

  return (
    <main className="page today">
      <div ref={indicator} className="ptr" aria-hidden="true" />
      <section className="scorebug" aria-labelledby="game-title">
        <div className="sb-meta">
          {label && <span className="sb-label">{t(label)}</span>}
          <time dateTime={date}>{fmtDate(lang, date, { weekday: "long", day: "numeric", month: "long" })}</time>
        </div>
        <div className="sb-teams">
          <span className="sb-code us">{us}</span>
          {played ? <span className="sb-result num" aria-label={`${played.runs_for}-${played.runs_against}`}>{played.runs_for}<span className="faint" aria-hidden="true">-</span>{played.runs_against}</span> : <span className="sb-at">{home ? t("vs") : "@"}</span>}
          <span className="sb-code">{bp.opponent_code}</span>
        </div>
        <h1 id="game-title" className="sb-opp">{home ? `${t("vs")} ` : "@ "}{bp.opponent_name}</h1>
        <Link to={`/estadio/${bp.stadium.id}`} className="sb-park">
          <span className="sb-venue">{bp.stadium.venue_name}</span>
          <span className="sb-alt">
            <span className="score" style={{ color: altitudeColor(alt) }}><CountUp value={alt} format={(v) => fmtInt(lang, v)} /><span className="sb-unit"> m</span></span>
            <span className="sb-alt-l">{t("altitude")}</span>
          </span>
        </Link>
        <p className="stamp">
          {t("dataAsOf", fmtDate(lang, bp.as_of, { day: "numeric", month: "short", year: "numeric" }))}
          <button type="button" className="stamp-refresh" onClick={refresh} disabled={busy}>{busy ? t("refreshing") : t("refresh")}</button>
        </p>
      </section>

      {series.length > 1 && (
        <div className="series" role="group" aria-label={t("seriesGames")}>
          {series.map((g) => (
            <button key={g.date} type="button" className={`chip ${g.date === date ? "on" : ""}`} aria-pressed={g.date === date} onClick={() => setSelectedDate(g.date)}>
              {fmtDate(lang, g.date, { weekday: "short", day: "numeric" })}
            </button>
          ))}
        </div>
      )}

      <section className="today-park" aria-labelledby="park-title">
        <h2 id="park-title" className="section-label">{t("parkInOne")}</h2>
        {st ? <p className="park-line">{parkPhrase(t, lang, st)}</p> : <div className="skel skel-line" />}
      </section>

      <section aria-labelledby="best-title">
        <h2 id="best-title" className="section-label">{t("bestHere")}</h2>
        <p className="muted small hint"><Term k="stuff">Stuff+</Term> {t("bestHereHint")} <Term k="verdict">{t("whatIsVerdict")}</Term></p>
        {top ? (
          <ol className="picks">
            {top.rows.map((r, i) => (
              <li key={r.pitcher_id} className="pick" style={{ ["--i" as string]: i }}>
                <Link to={`/lanzador/${r.pitcher_id}`} className="pick-link">
                  <span className="pick-rank num" aria-hidden="true">{r.rank}</span>
                  <span className="pick-body">
                    <span className="pick-head">
                      <span className="pick-name num">{r.name}</span>
                      <Verdict kind={verdictFor(r.stuff_plus, scale)} />
                    </span>
                    <span className="pick-why">{pitcherPhrase(t, lang, r, sid === meta?.home_stadium_id ? "home" : "here")}</span>
                  </span>
                  <span className="pick-num num">{fmt(r.stuff_plus)}</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : <div className="skel skel-card" />}
      </section>

      <section aria-labelledby="bullpen-title" className="today-bullpen">
        <h2 id="bullpen-title" className="section-label">{t("yourBullpen")}</h2>
        {bp.relievers.length > 0 ? <BullpenList data={bp} scale={scale} /> : (
          <div className="empty-note">
            <Diablo size={88} full />
            <p>{t("bullpenEmpty")}</p>
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyNote({ text, onRetry }: { text: string; onRetry?: () => void }) {
  const { t } = useLang();
  return (
    <div className="empty-note">
      <Diablo size={88} full />
      <div>
        <p>{text}</p>
        {onRetry && <button type="button" className="btn" onClick={onRetry} style={{ marginRight: 8 }}>{t("retry")}</button>}
        <Link to="/explorar" className="btn">{t("goExplore")}</Link>
      </div>
    </div>
  );
}

const PULL_TRIGGER = 70; // px

/** Deslizar hacia abajo desde arriba de Hoy para recargar (en pantallas táctiles). El indicador se mueve
 *  directo en el DOM durante el gesto; el botón "Actualizar" hace lo mismo sin gesto. */
function usePullToRefresh(onRefresh: () => void) {
  const { t } = useLang();
  const indicator = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!window.matchMedia?.("(pointer: coarse)").matches) return;
    let startY: number | null = null;
    let dist = 0;
    const paint = (d: number) => {
      const el = indicator.current;
      if (!el) return;
      el.style.height = `${Math.min(d, 120) / 2}px`;
      el.style.opacity = String(Math.min(1, d / PULL_TRIGGER));
      el.textContent = d > PULL_TRIGGER ? t("pullRelease") : "";
    };
    const start = (e: TouchEvent) => { startY = window.scrollY <= 0 ? e.touches[0].clientY : null; dist = 0; };
    const move = (e: TouchEvent) => { if (startY == null) return; dist = Math.max(0, e.touches[0].clientY - startY); paint(dist); };
    const end = () => {
      if (startY != null && dist > PULL_TRIGGER) {
        setBusy(true);
        onRefresh();
        window.setTimeout(() => setBusy(false), 800);
      }
      startY = null;
      paint(0);
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", end);
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
    };
  }, [onRefresh, t]);
  return { indicator, busy };
}

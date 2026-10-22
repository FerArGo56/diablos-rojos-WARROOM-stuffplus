import { useEffect, useRef } from "react";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { InstallHint, OfflineBanner } from "./components/AppNotices";
import { BottomNav } from "./components/BottomNav";
import { Diablo } from "./components/Diablo";
import { useLang } from "./i18n";
import { useAppState } from "./state";
import TodayPage from "./pages/TodayPage";
import ExplorePage from "./pages/ExplorePage";
import StadiumPage from "./pages/StadiumPage";
import PitcherPage from "./pages/PitcherPage";
import FreeAgentsPage from "./pages/FreeAgentsPage";
import WhatIfPage from "./pages/WhatIfPage";
import MethodologyPage from "./pages/MethodologyPage";

export default function App() {
  const { t, lang, setLang } = useLang();
  const { meta } = useAppState();
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <a href="#main" className="skip-link">{t("skipToContent")}</a>
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label={t("appName")}>
          <Diablo size={30} />
          <span>Diablos Stuff<span className="plus">+</span></span>
        </NavLink>
        <nav className="nav nav-desktop" aria-label={t("mainNav")}>
          <NavLink to="/" end>{t("navToday")}</NavLink>
          <NavLink to="/agentes-libres">{t("navFreeAgents")}</NavLink>
          <NavLink to="/y-si">{t("navWhatIf")}</NavLink>
          <NavLink to="/explorar">{t("navExplore")}</NavLink>
          <NavLink to="/metodologia">{t("navMethod")}</NavLink>
        </nav>
        <div className="spacer" />
        {meta?.model === "placeholder" && <span className="chip gold model-chip">{t("placeholderModel")}</span>}
        <div className="lang-toggle" role="group" aria-label="Idioma / Language">
          <button type="button" className={lang === "es" ? "on" : ""} aria-pressed={lang === "es"} onClick={() => setLang("es")}>ES</button>
          <button type="button" className={lang === "en" ? "on" : ""} aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
        </div>
        <MoreMenu />
      </header>
      {meta?.synthetic && <div className="banner">{t("syntheticBanner")}</div>}
      <OfflineBanner />
      <InstallHint />
      <div id="main" tabIndex={-1} className="route" key={pathname}>
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/explorar" element={<ExplorePage />} />
          <Route path="/estadio/:id" element={<StadiumPage />} />
          <Route path="/lanzador/:id" element={<PitcherPage />} />
          <Route path="/agentes-libres" element={<FreeAgentsPage />} />
          <Route path="/y-si" element={<WhatIfPage />} />
          <Route path="/metodologia" element={<MethodologyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </>
  );
}

/** En celular, Metodología vive en este menú; en escritorio está en la barra. */
function MoreMenu() {
  const { t } = useLang();
  const { pathname } = useLocation();
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (ref.current) ref.current.open = false; }, [pathname]);
  return (
    <details ref={ref} className="more-menu"
      onKeyDown={(e) => { if (e.key === "Escape" && ref.current?.open) { ref.current.open = false; ref.current.querySelector("summary")?.focus(); } }}>
      <summary>{t("navMore")}</summary>
      <div className="more-pop">
        <NavLink to="/metodologia">{t("navMethod")}</NavLink>
      </div>
    </details>
  );
}

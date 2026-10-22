import { NavLink } from "react-router-dom";
import { useLang } from "../i18n";

/** Barra inferior en celular (< 768 px). En escritorio la navegación vive en la barra superior. */
export function BottomNav() {
  const { t } = useLang();
  return (
    <nav className="bottomnav" aria-label={t("mainNav")}>
      <NavLink to="/" end>{t("navExplore")}</NavLink>
      <NavLink to="/hoy">{t("navToday")}</NavLink>
      <NavLink to="/agentes-libres">{t("navFreeAgents")}</NavLink>
      <NavLink to="/y-si">{t("navWhatIf")}</NavLink>
    </nav>
  );
}

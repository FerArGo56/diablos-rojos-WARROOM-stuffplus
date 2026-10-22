import { Link, useLocation } from "react-router-dom";
import { useLang } from "../i18n";
import { Diablo } from "./Diablo";

/** El diablito que pregunta "¿Bullpen?" y lleva a la sección del bullpen en Hoy.
 *  Solo en compu (en celular tapaba contenido y Hoy ya está en la barra inferior); en Hoy no aparece. */
export function BullpenButton() {
  const { t } = useLang();
  const { pathname } = useLocation();
  if (pathname === "/hoy") return null;
  return (
    <Link to="/hoy#bullpen" className="diablo-btn" aria-label={t("bullpenTitle")}>
      <span className="diablo-bubble" aria-hidden="true">{t("diabloHint")}</span>
      <Diablo size={104} full />
    </Link>
  );
}

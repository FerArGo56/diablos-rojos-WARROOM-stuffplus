import { useEffect, useState } from "react";
import { LOCALES, useLang } from "../i18n";
import { useOffline } from "../offline";

/** "Sin conexión · datos de hace 2 h" cuando lo que se ve viene de la caché del service worker. */
export function OfflineBanner() {
  const { t, lang } = useLang();
  const { fromCache, dataAt } = useOffline();
  if (!fromCache) return null;
  return <div className="notice offline" role="status">{dataAt ? t("offlineData", ago(dataAt, LOCALES[lang])) : t("offlineSaved")}</div>;
}

function ago(at: number, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  const min = Math.round((Date.now() - at) / 60000);
  if (min < 60) return rtf.format(-Math.max(1, min), "minute");
  const h = Math.round(min / 60);
  if (h < 48) return rtf.format(-h, "hour");
  return rtf.format(-Math.round(h / 24), "day");
}

type InstallEvent = Event & { prompt: () => Promise<void> };
const DISMISS_KEY = "install-hint-dismissed";

/** Aviso de instalación, una sola vez: en iPhone explica Compartir → Agregar a inicio;
 *  en Android/Chrome usa el aviso nativo del navegador. No aparece si ya está instalada. */
export function InstallHint() {
  const { t } = useLang();
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as InstallEvent); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (dismissed || standalone || (!ios && !prompt)) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* sin almacenamiento: vuelve a salir */ }
  };
  return (
    <div className="notice install" role="note">
      <span>{ios ? t("installIos") : t("installHint")}</span>
      {!ios && prompt && <button type="button" className="btn primary" onClick={async () => { await prompt.prompt(); dismiss(); }}>{t("installApp")}</button>}
      <button type="button" className="notice-close" onClick={dismiss} aria-label={t("close")}>✕</button>
    </div>
  );
}

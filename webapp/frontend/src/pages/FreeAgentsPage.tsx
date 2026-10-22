import { FreeAgentTable } from "../components/FreeAgentTable";
import { useLang } from "../i18n";

export default function FreeAgentsPage() {
  const { t } = useLang();
  return (
    <main className="page fa-page">
      <h1>{t("faTitle")}</h1>
      <p className="muted lede">{t("faHint")}</p>
      <FreeAgentTable />
    </main>
  );
}

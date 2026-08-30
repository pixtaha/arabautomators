import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getModulesWithSessions } from "@/lib/data/modules";

export default async function DashboardPage() {
  const modules = await getModulesWithSessions();
  const firstSessionId = modules.find((module) => module.sessionId)?.sessionId ?? null;

  return <DashboardClient modules={modules} firstSessionId={firstSessionId} />;
}

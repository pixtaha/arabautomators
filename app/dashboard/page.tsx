import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getModulesWithSessions } from "@/lib/data/modules";

// getModulesWithSessions reads modules/sessions with the service-role key,
// which is only available at container runtime (docker-compose), not at
// build time. Force this route to render per-request instead of being
// statically generated at build time. Also correct anyway: the Dashboard
// shows authenticated per-user data that shouldn't be cached/static.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const modules = await getModulesWithSessions();
  const firstSessionId = modules.find((module) => module.sessionId)?.sessionId ?? null;

  return <DashboardClient modules={modules} firstSessionId={firstSessionId} />;
}

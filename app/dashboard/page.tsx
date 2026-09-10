import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getModulesWithSessions } from "@/lib/data/modules";
import { requireDeviceSession } from "@/lib/auth/device-session";
import { requireAdmin } from "@/lib/adminAuth";

// getModulesWithSessions reads modules/sessions with the service-role key,
// which is only available at container runtime (docker-compose), not at
// build time. Force this route to render per-request instead of being
// statically generated at build time. Also correct anyway: the Dashboard
// shows authenticated per-user data that shouldn't be cached/static.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireDeviceSession();
  const [modules, adminUser] = await Promise.all([getModulesWithSessions(), requireAdmin()]);
  const firstSessionId = modules.find((module) => module.sessionId)?.sessionId ?? null;

  return <DashboardClient modules={modules} firstSessionId={firstSessionId} isAdmin={Boolean(adminUser)} />;
}

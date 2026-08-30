import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getModulesWithSessions } from "@/lib/data/modules";

export default async function DashboardPage() {
  const modules = await getModulesWithSessions();

  return <DashboardClient modules={modules} />;
}

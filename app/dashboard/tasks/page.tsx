import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getModulesWithTasks } from "@/lib/data/tasks";
import { TasksClient } from "@/components/dashboard/TasksClient";

// getModulesWithTasks reads with the service-role key, which is only
// available at container runtime, not build time -- force per-request
// rendering. Also correct anyway: this shows authenticated per-user data.
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const modules = await getModulesWithTasks();

  return <TasksClient modules={modules} />;
}

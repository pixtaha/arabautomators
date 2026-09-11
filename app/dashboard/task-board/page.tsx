import { TaskBoardClient } from "@/components/dashboard/TaskBoardClient";
import { getActiveTaskBoardTasks, getStudentSubmissions, getTaskCompletions } from "@/lib/data/taskBoard";
import { requireDeviceSession } from "@/lib/auth/device-session";

// Same reasoning as app/dashboard/page.tsx: this reads with the
// service-role key (only available at container runtime) and shows
// per-student data, so it can't be statically generated.
export const dynamic = "force-dynamic";

export default async function TaskBoardPage() {
  const session = await requireDeviceSession();
  const [tasks, submissions, completions] = await Promise.all([
    getActiveTaskBoardTasks(),
    getStudentSubmissions(session.user.id),
    getTaskCompletions(),
  ]);

  return <TaskBoardClient initialTasks={tasks} initialSubmissions={submissions} initialCompletions={completions} />;
}

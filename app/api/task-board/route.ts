import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { getActiveTaskBoardTasks, getStudentSubmissions, getTaskCompletions, getResourcesByTaskIds, TaskBoardReadError } from "@/lib/data/taskBoard";

export async function GET() {
  const session = await getActiveDeviceSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [tasks, submissions, completions] = await Promise.all([
      getActiveTaskBoardTasks(),
      getStudentSubmissions(session.user.id),
      getTaskCompletions(),
    ]);
    // Resources are admin-authored; the client filters them by level.
    const resources = await getResourcesByTaskIds(tasks.map((t) => t.id));

    return Response.json({ tasks, submissions, completions, resources }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (!(error instanceof TaskBoardReadError)) throw error;
    return Response.json({ error: error.message }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}

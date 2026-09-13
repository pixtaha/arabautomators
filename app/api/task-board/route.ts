import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { getActiveTaskBoardTasks, getStudentSubmissions, getTaskCompletions, getResourcesByTaskIds } from "@/lib/data/taskBoard";

export async function GET() {
  const session = await getActiveDeviceSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [tasks, submissions, completions] = await Promise.all([
    getActiveTaskBoardTasks(),
    getStudentSubmissions(session.user.id),
    getTaskCompletions(),
  ]);
  // Small, admin-authored, and not sensitive -- every resource for every
  // active task is sent down, and the client filters by its own currently-
  // selected level (same fallback pattern as descriptionForLevel/
  // checklistForLevel), rather than this being computed per-viewer here.
  const resources = await getResourcesByTaskIds(tasks.map((t) => t.id));

  return Response.json({ tasks, submissions, completions, resources }, { headers: { "Cache-Control": "private, no-store" } });
}

import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { getActiveTaskBoardTasks, getStudentSubmissions, getTaskCompletions } from "@/lib/data/taskBoard";

export async function GET() {
  const session = await getActiveDeviceSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [tasks, submissions, completions] = await Promise.all([
    getActiveTaskBoardTasks(),
    getStudentSubmissions(session.user.id),
    getTaskCompletions(),
  ]);

  return Response.json({ tasks, submissions, completions }, { headers: { "Cache-Control": "private, no-store" } });
}

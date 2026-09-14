import { SocialSubmissionsClient } from "@/components/dashboard/SocialSubmissionsClient";
import { getActiveSocialWindows, getStudentSocialSubmissions } from "@/lib/data/socialSubmissions";
import { requireDeviceSession } from "@/lib/auth/device-session";

// Same reasoning as app/dashboard/task-board/page.tsx: reads with the
// service-role key (only available at container runtime) and shows
// per-student data, so it can't be statically generated.
export const dynamic = "force-dynamic";

export default async function SocialSubmissionsPage() {
  const session = await requireDeviceSession();
  const [windows, submissions] = await Promise.all([
    getActiveSocialWindows(),
    getStudentSocialSubmissions(session.user.id),
  ]);

  return <SocialSubmissionsClient initialWindows={windows} initialSubmissions={submissions} />;
}

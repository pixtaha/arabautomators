import { ApiLabDocsClient } from "./ApiLabDocsClient";
import { requireDeviceSession } from "@/lib/auth/device-session";

// Same reasoning as app/dashboard/task-board/page.tsx: this is per-student
// authenticated content, so it can't be statically generated.
export const dynamic = "force-dynamic";

export default async function ApiLabDocsPage() {
  await requireDeviceSession();
  return <ApiLabDocsClient />;
}

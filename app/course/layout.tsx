import type { ReactNode } from "react";
import { requireDeviceSession } from "@/lib/auth/device-session";

export default async function CourseLayout({ children }: { children: ReactNode }) {
  await requireDeviceSession();
  return children;
}

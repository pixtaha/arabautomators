import type { ReactNode } from "react";
import { requireDeviceSession } from "@/lib/auth/device-session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireDeviceSession();
  return children;
}

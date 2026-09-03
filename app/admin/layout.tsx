import type { ReactNode } from "react";
import { requireDeviceSession } from "@/lib/auth/device-session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireDeviceSession();
  return children;
}

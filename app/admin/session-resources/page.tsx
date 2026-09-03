import { redirect } from "next/navigation";
import { SessionResourcesAdminClient } from "@/components/admin/SessionResourcesAdminClient";
import { requireAdmin } from "@/lib/adminAuth";

export default async function SessionResourcesAdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  return <SessionResourcesAdminClient />;
}

import { redirect } from "next/navigation";
import { AdminSocialSubmissionsClient } from "@/components/admin/AdminSocialSubmissionsClient";
import { requireAdmin } from "@/lib/adminAuth";

export default async function AdminSocialSubmissionsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  return <AdminSocialSubmissionsClient />;
}

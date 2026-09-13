import { redirect } from "next/navigation";
import { AdminTaskBoardSubmissionsClient } from "@/components/admin/AdminTaskBoardSubmissionsClient";
import { requireAdmin } from "@/lib/adminAuth";

export default async function AdminTaskBoardSubmissionsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  return <AdminTaskBoardSubmissionsClient />;
}

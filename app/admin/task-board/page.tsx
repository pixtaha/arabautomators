import { redirect } from "next/navigation";
import { AdminTaskBoardClient } from "@/components/admin/AdminTaskBoardClient";
import { requireAdmin } from "@/lib/adminAuth";

export default async function AdminTaskBoardPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  return <AdminTaskBoardClient />;
}

import { redirect } from "next/navigation";
import { AdminQuizResultsClient } from "@/components/admin/AdminQuizResultsClient";
import { requireAdmin } from "@/lib/adminAuth";

export default async function AdminQuizResultsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  return <AdminQuizResultsClient />;
}

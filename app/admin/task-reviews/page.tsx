import { redirect } from "next/navigation";
import { AdminTaskReviewsClient } from "@/components/admin/AdminTaskReviewsClient";
import { requireAdmin } from "@/lib/adminAuth";

export default async function AdminTaskReviewsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  return <AdminTaskReviewsClient />;
}

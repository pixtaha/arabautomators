import { redirect } from "next/navigation";
import { AdminQuizzesClient } from "@/components/admin/AdminQuizzesClient";
import { requireAdmin } from "@/lib/adminAuth";

export default async function AdminQuizzesPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  return <AdminQuizzesClient />;
}

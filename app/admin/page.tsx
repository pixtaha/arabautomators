import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { requireAdmin } from "@/lib/adminAuth";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  return <AdminPanel liveVisitorCount={0} totalSiteOpens={0} />;
}

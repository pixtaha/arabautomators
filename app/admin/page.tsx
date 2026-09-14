import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { LiveVisitorCount } from "@/components/admin/LiveVisitorCount";
import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const supabase = createAdminClient();
  const { count, error } = await supabase.from("page_views").select("*", { count: "exact", head: true });
  const totalSiteOpens = error ? 0 : (count ?? 0);

  return <AdminPanel liveVisitorCount={<LiveVisitorCount />} totalSiteOpens={totalSiteOpens} />;
}

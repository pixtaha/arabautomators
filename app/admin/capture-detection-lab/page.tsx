import { redirect } from "next/navigation";
import { CaptureDetectionLab } from "@/components/admin/CaptureDetectionLab";
import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function CaptureDetectionLabPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");
  const supabase = createAdminClient();
  const { data: session } = await supabase.from("sessions").select("id,title,main_video_bunny_id").not("main_video_bunny_id", "is", null).order("order_index").limit(1).maybeSingle();
  if (!session?.main_video_bunny_id) return <main className="p-8">No Bunny test video is configured.</main>;
  return <CaptureDetectionLab sessionId={session.id} videoId={session.main_video_bunny_id} title={session.title} />;
}

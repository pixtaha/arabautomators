import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionResourcesAdminClient } from "@/components/admin/SessionResourcesAdminClient";

export default async function SessionResourcesAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "admin") redirect("/");

  return <SessionResourcesAdminClient />;
}

import { createAdminClient } from "@/lib/supabase/admin";

export async function getActiveStudentCount(): Promise<number | null> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (error) return null;
  return count ?? 0;
}

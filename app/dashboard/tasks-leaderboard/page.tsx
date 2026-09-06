import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TasksLeaderboardClient } from "@/components/dashboard/TasksLeaderboardClient";

export const dynamic = "force-dynamic";

export default async function TasksLeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <TasksLeaderboardClient />;
}

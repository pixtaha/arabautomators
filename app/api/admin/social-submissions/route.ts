import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_STATUSES = ["pending", "approved", "sent_back"] as const;

// No FK from social_submissions to social_windows/profiles that PostgREST
// can embed cleanly across two independent bulk lookups, so the join
// happens in JS from bulk IN() queries -- same approach
// app/api/admin/task-board/submissions/route.ts already uses.
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const statusParam = new URL(request.url).searchParams.get("status");
  const supabase = createAdminClient();

  let query = supabase
    .from("social_submissions")
    .select(
      "id, window_id, student_id, post_url, status, admin_comment, points_awarded, reviewed_by, reviewed_at, created_at, updated_at",
    )
    .order("created_at", { ascending: true });

  // Default view: everything actually awaiting a decision. Any other
  // single status can be requested explicitly.
  if (statusParam && (VALID_STATUSES as readonly string[]).includes(statusParam)) {
    query = query.eq("status", statusParam);
  } else {
    query = query.eq("status", "pending");
  }

  const { data: rows, error } = await query;
  if (error) return Response.json({ error: "Could not load submissions." }, { status: 500 });
  if (!rows || rows.length === 0) return Response.json({ submissions: [] });

  const windowIds = [...new Set(rows.map((r) => r.window_id))];
  const studentIds = [...new Set(rows.map((r) => r.student_id))];

  const [{ data: windows }, { data: profiles }] = await Promise.all([
    supabase.from("social_windows").select("id, title").in("id", windowIds),
    supabase.from("profiles").select("id, username, avatar_url").in("id", studentIds),
  ]);

  const windowById = new Map((windows ?? []).map((w) => [w.id, w]));
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const submissions = rows.map((row) => {
    const socialWindow = windowById.get(row.window_id);
    const profile = profileById.get(row.student_id);
    return {
      ...row,
      window_title: socialWindow?.title ?? "Social window",
      student_username: (profile?.username as string | null) ?? null,
      student_avatar_url: (profile?.avatar_url as string | null) ?? null,
    };
  });

  return Response.json({ submissions });
}

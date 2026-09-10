import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();

  const [{ data: sessions, error: sessionsError }, { data: modules }] = await Promise.all([
    supabase.from("sessions").select("id, title, order_index, module_id").order("order_index"),
    supabase.from("modules").select("id, order_index"),
  ]);

  if (sessionsError || !sessions) {
    return Response.json({ error: "Could not load sessions." }, { status: 500 });
  }

  const moduleOrderById = new Map((modules ?? []).map((m) => [m.id, m.order_index]));

  const result = sessions
    .map((s) => ({
      id: s.id as string,
      title: s.title as string,
      orderIndex: s.order_index as number,
      moduleOrderIndex: s.module_id ? (moduleOrderById.get(s.module_id) ?? null) : null,
    }))
    .sort((a, b) => (a.moduleOrderIndex ?? 0) - (b.moduleOrderIndex ?? 0) || a.orderIndex - b.orderIndex);

  return Response.json({ sessions: result });
}

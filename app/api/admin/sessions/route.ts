import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();

  const [{ data: sessions, error: sessionsError }, { data: modules }] = await Promise.all([
    supabase.from("sessions").select("id, title, order_index, module_id").order("order_index"),
    supabase.from("modules").select("id, order_index, title").order("order_index"),
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

  const moduleOptions = (modules ?? []).map((m) => ({
    id: m.id as string,
    title: m.title as string,
    orderIndex: m.order_index as number,
  }));

  return Response.json({ sessions: result, modules: moduleOptions });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  let input: unknown;
  try { input = await request.json(); } catch { /* invalid JSON */ }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return Response.json({ error: "A title and module are required." }, { status: 400 });
  }

  const { title, moduleId, orderIndex, description } = input as {
    title?: unknown; moduleId?: unknown; orderIndex?: unknown; description?: unknown;
  };

  if (typeof title !== "string" || !title.trim()) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }
  if (typeof moduleId !== "string" || !UUID_RE.test(moduleId)) {
    return Response.json({ error: "Choose a module." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: module, error: moduleError } = await admin
    .from("modules").select("id").eq("id", moduleId).maybeSingle();
  if (moduleError || !module) return Response.json({ error: "Module not found." }, { status: 404 });

  let resolvedOrderIndex: number;
  if (orderIndex !== undefined) {
    if (typeof orderIndex !== "number" || !Number.isInteger(orderIndex) || orderIndex < 1) {
      return Response.json({ error: "Order index must be a positive whole number." }, { status: 400 });
    }
    resolvedOrderIndex = orderIndex;
  } else {
    const { data: last, error: orderError } = await admin.from("sessions")
      .select("order_index").eq("module_id", moduleId).order("order_index", { ascending: false }).limit(1);
    if (orderError) return Response.json({ error: "Could not create session." }, { status: 500 });
    resolvedOrderIndex = (last?.[0]?.order_index ?? 0) + 1;
  }

  let sessionDescription: string | null = null;
  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      return Response.json({ error: "Invalid description." }, { status: 400 });
    }
    sessionDescription = description.trim() || null;
  }

  // status is intentionally omitted: sessions.status defaults to 'upcoming' at the DB level.
  const { data: session, error } = await admin.from("sessions").insert({
    title: title.trim(),
    module_id: moduleId,
    order_index: resolvedOrderIndex,
    description: sessionDescription,
  }).select("id, title, order_index, module_id, status").single();

  if (error || !session) return Response.json({ error: "Could not create session." }, { status: 500 });
  return Response.json({ session });
}

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const N8N_FETCH_TIMEOUT_MS = 4000;

export interface N8nWorkflowStatus {
  status: "ok" | "unavailable";
  total: number;
  active: number;
  inactive: number;
}

const UNAVAILABLE: N8nWorkflowStatus = { status: "unavailable", total: 0, active: 0, inactive: 0 };

interface N8nWorkflowListResponse {
  data?: Array<{ active?: boolean }>;
}

// student_n8n_credentials has an admin-only RLS policy (it also holds n8n
// login passwords), so students can't read even their own row directly.
// We use the service-role client instead, but scope every query to the
// student resolved from the caller's own session email — never accept a
// student id from the client.
export async function getStudentWorkflowStatus(email: string | null | undefined): Promise<N8nWorkflowStatus> {
  if (!email) return UNAVAILABLE;

  const supabase = createAdminClient();

  const { data: student } = await supabase.from("students").select("id").ilike("email", email).maybeSingle();

  if (!student) return UNAVAILABLE;

  const { data: credential } = await supabase
    .from("student_n8n_credentials")
    .select("n8n_url, n8n_api_key")
    .eq("student_id", student.id)
    .maybeSingle();

  if (!credential?.n8n_api_key) return UNAVAILABLE;

  try {
    const res = await fetch(`${credential.n8n_url.replace(/\/$/, "")}/api/v1/workflows`, {
      headers: { "X-N8N-API-KEY": credential.n8n_api_key },
      signal: AbortSignal.timeout(N8N_FETCH_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!res.ok) return UNAVAILABLE;

    const body = (await res.json()) as N8nWorkflowListResponse;
    const workflows = body.data ?? [];
    const active = workflows.filter((w) => w.active).length;

    return { status: "ok", total: workflows.length, active, inactive: workflows.length - active };
  } catch {
    return UNAVAILABLE;
  }
}

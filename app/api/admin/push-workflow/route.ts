import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

const N8N_INTERNAL_PORT = 5678;
const PUSH_TIMEOUT_MS = 15_000;
const CONCURRENCY = 5;

interface StudentTarget {
  subdomain: string;
  studentName: string;
}

interface PushResult {
  subdomain: string;
  studentName: string;
  success: boolean;
  message: string;
}

function sanitizeWorkflowPayload(parsed: unknown, fallbackName: string) {
  if (typeof parsed !== "object" || parsed === null) {
    return { error: "File is not a JSON object." } as const;
  }
  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.nodes)) {
    return { error: 'Workflow JSON is missing a "nodes" array.' } as const;
  }
  if (typeof obj.connections !== "object" || obj.connections === null || Array.isArray(obj.connections)) {
    return { error: 'Workflow JSON is missing a "connections" object.' } as const;
  }

  const name = typeof obj.name === "string" && obj.name.trim() ? obj.name : fallbackName;
  const settings = typeof obj.settings === "object" && obj.settings !== null && !Array.isArray(obj.settings) ? obj.settings : {};

  return {
    payload: { name, nodes: obj.nodes, connections: obj.connections, settings },
  } as const;
}

async function pushToStudent(
  target: StudentTarget,
  apiKey: string,
  payload: Record<string, unknown>,
): Promise<PushResult> {
  const url = `http://n8n-${target.subdomain}:${N8N_INTERNAL_PORT}/api/v1/workflows`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
    });

    const bodyText = await res.text();
    if (res.ok) {
      let workflowName = payload.name as string;
      try {
        const parsed = JSON.parse(bodyText) as { name?: string };
        if (parsed.name) workflowName = parsed.name;
      } catch {
        // ignore parse errors, fall back to the name we sent
      }
      return {
        subdomain: target.subdomain,
        studentName: target.studentName,
        success: true,
        message: `Created "${workflowName}"`,
      };
    }

    let errorMessage = bodyText.slice(0, 300);
    try {
      const parsed = JSON.parse(bodyText) as { message?: string };
      if (parsed.message) errorMessage = parsed.message;
    } catch {
      // keep the raw text
    }
    return {
      subdomain: target.subdomain,
      studentName: target.studentName,
      success: false,
      message: `HTTP ${res.status}: ${errorMessage}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      subdomain: target.subdomain,
      studentName: target.studentName,
      success: false,
      message: `Could not reach instance: ${message}`,
    };
  }
}

async function pushInBatches(
  targets: Array<StudentTarget & { apiKey: string }>,
  payload: Record<string, unknown>,
): Promise<PushResult[]> {
  const results: PushResult[] = [];
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const chunk = targets.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(chunk.map((t) => pushToStudent(t, t.apiKey, payload)));
    results.push(...chunkResults);
  }
  return results;
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "A workflow JSON file is required." }, { status: 400 });
  }

  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return Response.json({ error: "File is not valid JSON." }, { status: 400 });
  }

  const fallbackName = file.name.replace(/\.json$/i, "") || "Untitled workflow";
  const sanitized = sanitizeWorkflowPayload(parsed, fallbackName);
  if ("error" in sanitized) {
    return Response.json({ error: sanitized.error }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("student_n8n_credentials")
    .select("subdomain, n8n_api_key, students(name)")
    .not("n8n_api_key", "is", null);

  if (error) {
    return Response.json({ error: "Could not load student credentials." }, { status: 500 });
  }

  const targets = (rows ?? [])
    .filter((row): row is typeof row & { n8n_api_key: string } => Boolean(row.n8n_api_key))
    .map((row) => {
      // PostgREST embeds a to-one relation as an object, but the untyped
      // client infers it as an array — normalize both shapes defensively.
      const student = row.students as unknown;
      const studentRecord = (Array.isArray(student) ? student[0] : student) as { name?: string | null } | null;
      return {
        subdomain: row.subdomain,
        apiKey: row.n8n_api_key,
        studentName: studentRecord?.name ?? row.subdomain,
      };
    });

  if (targets.length === 0) {
    return Response.json({ error: "No students with an n8n API key were found." }, { status: 400 });
  }

  const results = await pushInBatches(targets, sanitized.payload);
  const succeeded = results.filter((r) => r.success).length;

  return Response.json({
    results,
    summary: { total: results.length, succeeded, failed: results.length - succeeded },
  });
}

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ModuleRow {
  order_index: number;
  title: string;
  description: string | null;
  available_date: string | null;
}

export async function getModules(): Promise<ModuleRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("modules")
    .select("order_index, title, description, available_date")
    .order("order_index");

  if (error || !data) return [];
  return data;
}

export interface ModuleWithSession {
  id: string;
  order_index: number;
  title: string;
  description: string | null;
  available_date: string | null;
  sessionId: string | null;
}

export async function getModulesWithSessions(): Promise<ModuleWithSession[]> {
  const supabase = createAdminClient();
  const [{ data: modules, error: modulesError }, { data: sessions }] = await Promise.all([
    supabase
      .from("modules")
      .select("id, order_index, title, description, available_date")
      .order("order_index"),
    supabase.from("sessions").select("id, module_id").order("order_index"),
  ]);

  if (modulesError || !modules) return [];

  const firstSessionByModule = new Map<string, string>();
  for (const session of sessions ?? []) {
    if (session.module_id && !firstSessionByModule.has(session.module_id)) {
      firstSessionByModule.set(session.module_id, session.id);
    }
  }

  return modules.map((module) => ({
    ...module,
    sessionId: firstSessionByModule.get(module.id) ?? null,
  }));
}

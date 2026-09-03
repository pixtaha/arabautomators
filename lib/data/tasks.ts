import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDeviceSession } from "@/lib/auth/device-session";

export interface TaskRow {
  id: string;
  module_id: string;
  order_index: number;
  title: string;
  title_ar: string | null;
  unlock_date: string | null;
}

export interface ModuleWithTasks {
  id: string;
  order_index: number;
  title: string;
  available_date: string | null;
  tasks: TaskRow[];
}

export async function getModulesWithTasks(): Promise<ModuleWithTasks[]> {
  await requireDeviceSession();
  const supabase = createAdminClient();
  const [{ data: modules, error: modulesError }, { data: tasks }] = await Promise.all([
    supabase.from("modules").select("id, order_index, title, available_date").order("order_index"),
    supabase
      .from("tasks")
      .select("id, module_id, order_index, title, title_ar, unlock_date")
      .order("order_index"),
  ]);

  if (modulesError || !modules) return [];

  const tasksByModule = new Map<string, TaskRow[]>();
  for (const task of tasks ?? []) {
    const list = tasksByModule.get(task.module_id) ?? [];
    list.push(task);
    tasksByModule.set(task.module_id, list);
  }

  return modules
    .map((module) => ({ ...module, tasks: tasksByModule.get(module.id) ?? [] }))
    .filter((module) => module.tasks.length > 0);
}

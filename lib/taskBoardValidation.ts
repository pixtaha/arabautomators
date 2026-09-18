import "server-only";
import { ALLOWED_CODE_LANGUAGES } from "@/lib/taskBoardConstants";

// Shared between the Task Board admin tasks POST (create) and PATCH (edit)
// routes. Unlike this codebase's usual convention of duplicating small
// view-layer helpers per file (formatDate/isArabicText/etc.), this stays as
// one copy: it mirrors real DB CHECK constraints
// (task_board_tasks_has_a_submission_type,
// task_board_task_resources_levels_match_scope,
// task_board_task_resources_content_matches_type), so two independently
// drifting copies could silently diverge from what the database actually
// enforces.

export const LEVEL_KEYS = ["base", "medium", "hard"] as const;
export type LevelKey = (typeof LEVEL_KEYS)[number];

export const RESOURCE_TYPES = ["image", "video", "pdf", "code"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_SCOPES = ["general", "levels"] as const;

export interface ParsedResource {
  type: ResourceType;
  label: string | null;
  scope: "general" | "levels";
  levels: LevelKey[] | null;
  url: string | null;
  code_content: string | null;
  code_language: string | null;
}

// Mirrors the CHECK constraints on task_board_task_resources (scope/levels
// agreement, content matching type) so a misconfigured resource gets a
// clear field-level message instead of a raw constraint-violation 500.
export function parseResource(input: unknown, index: number): ParsedResource | { error: string } {
  const r = (input ?? {}) as Record<string, unknown>;
  const label = typeof r.label === "string" && r.label.trim() ? r.label.trim() : null;

  if (typeof r.type !== "string" || !(RESOURCE_TYPES as readonly string[]).includes(r.type)) {
    return { error: `Resource ${index + 1}: invalid type.` };
  }
  const type = r.type as ResourceType;

  if (typeof r.scope !== "string" || !(RESOURCE_SCOPES as readonly string[]).includes(r.scope)) {
    return { error: `Resource ${index + 1}: choose a scope (General or Specific levels).` };
  }
  const scope = r.scope as "general" | "levels";

  let levels: LevelKey[] | null = null;
  if (scope === "levels") {
    const raw = Array.isArray(r.levels) ? r.levels : [];
    const filtered = raw.filter((l): l is LevelKey => typeof l === "string" && (LEVEL_KEYS as readonly string[]).includes(l));
    if (filtered.length === 0) {
      return { error: `Resource ${index + 1}: pick at least one level.` };
    }
    levels = filtered;
  }

  if (type === "code") {
    if (typeof r.codeContent !== "string" || !r.codeContent.trim()) {
      return { error: `Resource ${index + 1}: code content is required.` };
    }
    const codeLanguage =
      typeof r.codeLanguage === "string" && (ALLOWED_CODE_LANGUAGES as readonly string[]).includes(r.codeLanguage)
        ? r.codeLanguage
        : ALLOWED_CODE_LANGUAGES[0];
    return { type, label, scope, levels, url: null, code_content: r.codeContent.trim().slice(0, 20_000), code_language: codeLanguage };
  }

  if (typeof r.url !== "string" || !r.url.trim()) {
    return { error: `Resource ${index + 1}: a ${type} URL is required.` };
  }
  try {
    new URL(r.url.trim());
  } catch {
    return { error: `Resource ${index + 1}: enter a valid URL.` };
  }
  return { type, label, scope, levels, url: r.url.trim(), code_content: null, code_language: null };
}

export interface ParsedLevel {
  enabled: boolean;
  points: number | null;
  description: string | null;
  checklist: string[] | null;
}

export function parseLevel(input: unknown): ParsedLevel | { error: string } {
  const level = (input ?? {}) as Record<string, unknown>;
  if (!level.enabled) {
    return { enabled: false, points: null, description: null, checklist: null };
  }
  if (typeof level.points !== "number" || !Number.isInteger(level.points) || level.points < 0) {
    return { error: "points must be a non-negative whole number" };
  }
  const description = typeof level.description === "string" && level.description.trim() ? level.description.trim() : null;
  const checklist = Array.isArray(level.checklist)
    ? level.checklist.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
    : [];
  return { enabled: true, points: level.points, description, checklist: checklist.length > 0 ? checklist : null };
}

// The client sends a full ISO instant here (already anchored to Cairo local
// time via cairoDateStringToUtcInstant() in CreateTaskBoardTaskForm.tsx),
// not a bare "YYYY-MM-DD" -- so this just validates/normalizes an
// unambiguous timestamp, not doing any timezone conversion of its own.
export function parseDate(input: unknown, label: string): { value: string | null } | { error: string } {
  if (typeof input !== "string" || !input.trim()) return { value: null };
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return { error: `Invalid ${label}.` };
  return { value: parsed.toISOString() };
}

// Colors are no longer admin-choosable at all: POST /tasks writes these
// directly on create, and PATCH never touches the columns afterward (see
// that route's comment), so a task's color -- default or a pre-existing
// custom one from before this became fully automatic -- can't be changed or
// overwritten through the admin form again. Hard has no default here: its
// color is a fixed constant in TaskBoardClient.tsx, not admin-configurable.
// The backfill migration (20260918_task_board_default_completion_colors.sql)
// applied these retroactively to tasks that predated the default.
export const DEFAULT_COMPLETED_COLOR_BASE = "#eff6ff";
export const DEFAULT_COMPLETED_COLOR_MEDIUM = "#fef3c7";

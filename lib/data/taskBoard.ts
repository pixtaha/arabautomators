import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type TaskBoardStatus = "todo" | "progress" | "submitted" | "reviewing" | "approved";
export type TaskBoardLevel = "base" | "medium" | "hard";

// Kinds of single-value file attachment a submission can carry -- "file" is
// the generic/original one; pdf/image/video were added when
// submission_format was replaced by independent per-type flags. Screenshots
// are NOT one of these -- they live in task_board_submission_files since a
// submission can have any number of them, not just zero-or-one.
export type SubmissionFileKind = "file" | "pdf" | "image" | "video";

export const SUBMISSION_FILE_KIND_COLUMNS: Record<
  SubmissionFileKind,
  { path: keyof TaskBoardSubmissionRow; name: keyof TaskBoardSubmissionRow; size: keyof TaskBoardSubmissionRow }
> = {
  file: { path: "submission_file_path", name: "submission_file_name", size: "submission_file_size_bytes" },
  pdf: { path: "submission_pdf_path", name: "submission_pdf_name", size: "submission_pdf_size_bytes" },
  image: { path: "submission_image_path", name: "submission_image_name", size: "submission_image_size_bytes" },
  video: { path: "submission_video_path", name: "submission_video_name", size: "submission_video_size_bytes" },
};

export type TaskBoardResourceType = "image" | "video" | "pdf" | "code";
export type TaskBoardResourceScope = "general" | "levels";

export interface TaskBoardTaskRow {
  id: string;
  order_index: number;
  title: string;
  title_ar: string | null;
  // General overview, shown regardless of level. Also the fallback for a
  // level whose own description_<level> is null.
  description: string | null;
  description_ar: string | null;
  // General checklist -- same fallback role as `description` above.
  checklist: string[];
  // null start_at = available immediately (matches today's only behavior,
  // before this column existed). null end_at = no deadline.
  start_at: string | null;
  end_at: string | null;
  points_base: number | null;
  points_medium: number | null;
  points_hard: number | null;
  // Per-level content: levels are genuinely different scope, not just a
  // point multiplier on identical work, so each enabled level (see
  // points_base/medium/hard and taskOffersLevel()) can carry its own
  // description/checklist. Null falls back to the general `description`/
  // `checklist` above -- this file is server-only, so that fallback
  // selection lives as a small local helper in TaskBoardClient.tsx
  // (matching how offeredLevels()/levelPoints() are already duplicated
  // there rather than imported from here) instead of being exported as a
  // runtime function from this module.
  description_base: string | null;
  description_medium: string | null;
  description_hard: string | null;
  checklist_base: string[] | null;
  checklist_medium: string[] | null;
  checklist_hard: string[] | null;
  // Replaces the old single, mutually-exclusive submission_format column --
  // any combination of these 5 can be true, and at least one must be (see
  // the task_board_tasks_has_a_submission_type CHECK constraint). Code and
  // screenshots below are separate, always-optional extras layered on top.
  requires_link: boolean;
  requires_pdf: boolean;
  requires_image: boolean;
  requires_video: boolean;
  requires_file: boolean;
  // Custom label for the link input when requires_link is true; null falls
  // back to a generic "Submission link" label.
  submission_link_label: string | null;
  // Same fallback role as submission_link_label, one per file-type flag --
  // a task can require more than one of pdf/image/video/file at once, and
  // each upload box needs its own hint (e.g. "screen recording" vs.
  // "exported workflow JSON"), so a single shared label wouldn't work.
  submission_pdf_label: string | null;
  submission_image_label: string | null;
  submission_video_label: string | null;
  submission_file_label: string | null;
  requires_code: boolean;
  // Placeholder shown in the code textarea when requires_code is true;
  // null falls back to the generic "Paste your code here" placeholder.
  submission_code_placeholder: string | null;
  requires_screenshots: boolean;
  is_active: boolean;
  // Background color for this task's card on a student's board once their
  // submission is approved at that level. Null = no custom color, card
  // keeps its plain background. Hard's completed color is fixed in the
  // client (solid green, white text), so it has no column here.
  completed_color_base: string | null;
  completed_color_medium: string | null;
}

export interface TaskBoardSubmissionRow {
  id: string;
  task_id: string;
  student_id: string;
  status: TaskBoardStatus;
  level: TaskBoardLevel | null;
  bonus_points: number;
  submission_link: string | null;
  submission_file_path: string | null;
  submission_file_name: string | null;
  submission_file_size_bytes: number | null;
  submission_pdf_path: string | null;
  submission_pdf_name: string | null;
  submission_pdf_size_bytes: number | null;
  submission_image_path: string | null;
  submission_image_name: string | null;
  submission_image_size_bytes: number | null;
  submission_video_path: string | null;
  submission_video_name: string | null;
  submission_video_size_bytes: number | null;
  submission_note: string | null;
  // Pasted code/text, only meaningful when the task's requires_code is
  // true -- but stored whenever provided, regardless of that flag.
  submission_code: string | null;
  // Set by an admin's "send back" action alongside status = 'progress'.
  // Distinguishes "sent back for changes" from a student's own ordinary
  // "in progress" placement (also status = 'progress', but admin_note is
  // null) on the student board. Cleared back to null on approval.
  admin_note: string | null;
  points_awarded: number | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

// One row per uploaded screenshot -- a submission can have zero to
// MAX_SCREENSHOT_COUNT (see the submission route) of these, unlike the
// single-value submission_link/submission_file_path fields above.
export interface TaskBoardSubmissionFileRow {
  id: string;
  submission_id: string;
  file_path: string;
  file_name: string;
  file_size_bytes: number | null;
  sort_order: number;
  created_at: string;
}

export type TaskBoardSubmissionPatch = Partial<
  Pick<
    TaskBoardSubmissionRow,
    | "status"
    | "level"
    | "submission_link"
    | "submission_file_path"
    | "submission_file_name"
    | "submission_file_size_bytes"
    | "submission_pdf_path"
    | "submission_pdf_name"
    | "submission_pdf_size_bytes"
    | "submission_image_path"
    | "submission_image_name"
    | "submission_image_size_bytes"
    | "submission_video_path"
    | "submission_video_name"
    | "submission_video_size_bytes"
    | "submission_note"
    | "submission_code"
    | "submitted_at"
  >
>;

// One row per admin-authored illustrative resource on a task -- any number
// per task, including several of the same type, each independently scoped
// to 'general' (always visible) or a specific subset of levels.
export interface TaskBoardResourceRow {
  id: string;
  task_id: string;
  type: TaskBoardResourceType;
  label: string | null;
  scope: TaskBoardResourceScope;
  levels: TaskBoardLevel[] | null;
  url: string | null;
  code_content: string | null;
  code_language: string | null;
  sort_order: number;
  created_at: string;
}

const TASK_COLUMNS =
  "id, order_index, title, title_ar, description, description_ar, checklist, start_at, end_at, points_base, points_medium, points_hard, description_base, description_medium, description_hard, checklist_base, checklist_medium, checklist_hard, requires_link, requires_pdf, requires_image, requires_video, requires_file, submission_link_label, submission_pdf_label, submission_image_label, submission_video_label, submission_file_label, requires_code, submission_code_placeholder, requires_screenshots, is_active, completed_color_base, completed_color_medium";

const SUBMISSION_COLUMNS =
  "id, task_id, student_id, status, level, bonus_points, submission_link, submission_file_path, submission_file_name, submission_file_size_bytes, submission_pdf_path, submission_pdf_name, submission_pdf_size_bytes, submission_image_path, submission_image_name, submission_image_size_bytes, submission_video_path, submission_video_name, submission_video_size_bytes, submission_note, submission_code, admin_note, points_awarded, submitted_at, reviewed_at, reviewed_by, created_at, updated_at";

const RESOURCE_COLUMNS = "id, task_id, type, label, scope, levels, url, code_content, code_language, sort_order, created_at";

export class TaskBoardReadError extends Error {
  constructor() {
    super("Could not load the Task Board. Please try again.");
    this.name = "TaskBoardReadError";
  }
}

function failTaskBoardRead(operation: string, error: { code?: string; message: string } | null): never {
  // Database diagnostics stay on the server. Only the generic error below
  // may reach the page boundary or API response.
  console.error("[task-board] Database read failed", {
    operation,
    code: error?.code ?? "NO_DATA",
    message: error?.message ?? "Query returned no data",
  });
  throw new TaskBoardReadError();
}

export async function getActiveTaskBoardTasks(): Promise<TaskBoardTaskRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("task_board_tasks")
    .select(TASK_COLUMNS)
    .eq("is_active", true)
    .order("order_index");

  if (error || !data) failTaskBoardRead("active tasks", error);
  return data;
}

export async function getTaskBoardTaskById(taskId: string): Promise<TaskBoardTaskRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("task_board_tasks").select(TASK_COLUMNS).eq("id", taskId).maybeSingle();

  if (error) failTaskBoardRead("task detail", error);
  return data;
}

export function taskOffersLevel(
  task: Pick<TaskBoardTaskRow, "points_base" | "points_medium" | "points_hard">,
  level: string,
): level is TaskBoardLevel {
  if (level === "base") return task.points_base !== null;
  if (level === "medium") return task.points_medium !== null;
  if (level === "hard") return task.points_hard !== null;
  return false;
}

export async function getStudentSubmissions(studentId: string): Promise<TaskBoardSubmissionRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("task_board_submissions").select(SUBMISSION_COLUMNS).eq("student_id", studentId);

  if (error || !data) failTaskBoardRead("student submissions", error);
  return data;
}

// Shared by both the student and admin "list screenshots" routes -- the
// only difference between them is the auth/ownership check before calling
// this, not the query itself.
export async function getSubmissionFiles(submissionId: string): Promise<TaskBoardSubmissionFileRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("task_board_submission_files")
    .select("id, submission_id, file_path, file_name, file_size_bytes, sort_order, created_at")
    .eq("submission_id", submissionId)
    .order("sort_order");

  if (error || !data) return [];
  return data;
}

// Batched across every active task in one query, same convention as
// getTaskCompletions() below -- resources are small, admin-authored, and
// not sensitive, so the client filters by level itself (same fallback
// pattern as descriptionForLevel/checklistForLevel in TaskBoardClient.tsx)
// rather than this being computed per-viewer server-side.
export async function getResourcesByTaskIds(taskIds: string[]): Promise<Record<string, TaskBoardResourceRow[]>> {
  if (taskIds.length === 0) return {};
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("task_board_task_resources")
    .select(RESOURCE_COLUMNS)
    .in("task_id", taskIds)
    .order("sort_order");

  if (error || !data) failTaskBoardRead("task resources", error);

  const byTask: Record<string, TaskBoardResourceRow[]> = {};
  for (const row of data) {
    (byTask[row.task_id] ??= []).push(row);
  }
  return byTask;
}

export interface TaskCompletionAvatar {
  student_id: string;
  username: string | null;
  avatar_url: string | null;
}

// Anyone who has at least turned a task in, regardless of admin review --
// this is intentionally student-facing social proof (see TaskBoardClient),
// not an admin-only view, so it only exposes id/username/avatar_url, never
// submission content, points, or email.
const COMPLETION_STATUSES: TaskBoardStatus[] = ["submitted", "reviewing", "approved"];

export async function getTaskCompletions(): Promise<Record<string, TaskCompletionAvatar[]>> {
  const supabase = createAdminClient();

  const { data: submissions, error } = await supabase
    .from("task_board_submissions")
    .select("task_id, student_id")
    .in("status", COMPLETION_STATUSES);

  if (error || !submissions) failTaskBoardRead("task completions", error);
  if (submissions.length === 0) return {};

  const studentIds = [...new Set(submissions.map((s) => s.student_id))];

  // Batched, not per-card: one profiles lookup for every distinct student
  // across the whole board. Same admin-exclusion convention as
  // /api/points/leaderboard and /api/tasks/leaderboard -- team accounts
  // don't appear in student-facing social features.
  const [{ data: profiles, error: profilesError }, { data: admins, error: adminsError }] = await Promise.all([
    supabase.from("profiles").select("id, username, avatar_url").in("id", studentIds),
    supabase.from("profiles").select("id").eq("role", "admin"),
  ]);

  if (profilesError || !profiles) failTaskBoardRead("completion profiles", profilesError);
  if (adminsError || !admins) failTaskBoardRead("completion admin exclusion", adminsError);

  const adminIds = new Set((admins ?? []).map((a) => a.id as string));
  const profileById = new Map((profiles ?? []).map((p) => [p.id as string, p]));

  const byTask: Record<string, TaskCompletionAvatar[]> = {};
  for (const s of submissions) {
    if (adminIds.has(s.student_id)) continue;
    const profile = profileById.get(s.student_id);
    (byTask[s.task_id] ??= []).push({
      student_id: s.student_id,
      username: (profile?.username as string | null) ?? null,
      avatar_url: (profile?.avatar_url as string | null) ?? null,
    });
  }
  return byTask;
}

/**
 * The one write path for a student's own submission row (status moves,
 * level pick, and actual link/file content). Enforces the "locked once
 * approved" rule atomically via `.neq("status", "approved")` on the
 * UPDATE itself, rather than a read-then-write check -- so a request can
 * never slip through between reading "not approved yet" and writing.
 *
 * Not a single upsert() call: supabase-js's upsert always does a plain
 * `ON CONFLICT (...) DO UPDATE SET <cols>` with no WHERE guard on the
 * conflict branch, so it can't express "skip the update if already
 * approved" in one statement. Instead: try the guarded UPDATE first; if
 * it affects no row, check whether that's because the row doesn't exist
 * yet (first time this student has touched this task -> INSERT) or
 * because it's already approved (-> 409). There is a narrow window
 * between the failed UPDATE and the existence check where a concurrent
 * request could change the row; given this app enforces a single active
 * device session per user, that race is not realistically reachable, so
 * it isn't worth a raw-SQL conditional-upsert RPC for full atomicity.
 */
export async function upsertOwnSubmission(
  taskId: string,
  studentId: string,
  patch: TaskBoardSubmissionPatch,
): Promise<{ submission: TaskBoardSubmissionRow } | { error: string; status: number }> {
  const admin = createAdminClient();

  const { data: updated, error: updateError } = await admin
    .from("task_board_submissions")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("task_id", taskId)
    .eq("student_id", studentId)
    .neq("status", "approved")
    .select(SUBMISSION_COLUMNS)
    .maybeSingle();

  if (updateError) return { error: "Could not update task.", status: 500 };
  if (updated) return { submission: updated };

  const { data: existing } = await admin
    .from("task_board_submissions")
    .select("id")
    .eq("task_id", taskId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (existing) {
    // A row exists but the guarded UPDATE above touched nothing -- the
    // only way that happens is the status filter excluded it, i.e. it's
    // already approved.
    return { error: "This task is already approved.", status: 409 };
  }

  const { data: inserted, error: insertError } = await admin
    .from("task_board_submissions")
    .insert({ task_id: taskId, student_id: studentId, ...patch })
    .select(SUBMISSION_COLUMNS)
    .single();

  if (insertError || !inserted) return { error: "Could not save submission.", status: 500 };
  return { submission: inserted };
}

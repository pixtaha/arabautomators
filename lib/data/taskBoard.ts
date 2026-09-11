import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type TaskBoardSubmissionFormat = "link" | "pdf" | "image" | "video" | "file";
export type TaskBoardStatus = "todo" | "progress" | "submitted" | "reviewing" | "approved";
export type TaskBoardLevel = "base" | "medium" | "hard";

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
  due_at: string | null;
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
  submission_format: TaskBoardSubmissionFormat;
  resource_youtube_url: string | null;
  resource_link_url: string | null;
  resource_link_label: string | null;
  resource_pdf_url: string | null;
  resource_image_url: string | null;
  is_active: boolean;
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
  submission_note: string | null;
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

export type TaskBoardSubmissionPatch = Partial<
  Pick<
    TaskBoardSubmissionRow,
    | "status"
    | "level"
    | "submission_link"
    | "submission_file_path"
    | "submission_file_name"
    | "submission_file_size_bytes"
    | "submission_note"
    | "submitted_at"
  >
>;

const TASK_COLUMNS =
  "id, order_index, title, title_ar, description, description_ar, checklist, due_at, points_base, points_medium, points_hard, description_base, description_medium, description_hard, checklist_base, checklist_medium, checklist_hard, submission_format, resource_youtube_url, resource_link_url, resource_link_label, resource_pdf_url, resource_image_url, is_active";

const SUBMISSION_COLUMNS =
  "id, task_id, student_id, status, level, bonus_points, submission_link, submission_file_path, submission_file_name, submission_file_size_bytes, submission_note, admin_note, points_awarded, submitted_at, reviewed_at, reviewed_by, created_at, updated_at";

export async function getActiveTaskBoardTasks(): Promise<TaskBoardTaskRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("task_board_tasks")
    .select(TASK_COLUMNS)
    .eq("is_active", true)
    .order("order_index");

  if (error || !data) return [];
  return data;
}

export async function getTaskBoardTaskById(taskId: string): Promise<TaskBoardTaskRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("task_board_tasks").select(TASK_COLUMNS).eq("id", taskId).maybeSingle();

  if (error || !data) return null;
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

  if (error || !data) return [];
  return data;
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

  if (error || !submissions || submissions.length === 0) return {};

  const studentIds = [...new Set(submissions.map((s) => s.student_id))];

  // Batched, not per-card: one profiles lookup for every distinct student
  // across the whole board. Same admin-exclusion convention as
  // /api/points/leaderboard and /api/tasks/leaderboard -- team accounts
  // don't appear in student-facing social features.
  const [{ data: profiles }, { data: admins }] = await Promise.all([
    supabase.from("profiles").select("id, username, avatar_url").in("id", studentIds),
    supabase.from("profiles").select("id").eq("role", "admin"),
  ]);

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

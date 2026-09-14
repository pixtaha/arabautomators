import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type SocialSubmissionStatus = "pending" | "approved" | "sent_back";

export interface SocialWindowRow {
  id: string;
  title: string;
  platform: string | null;
  opens_at: string;
  closes_at: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface SocialSubmissionRow {
  id: string;
  window_id: string;
  student_id: string;
  post_url: string;
  status: SocialSubmissionStatus;
  admin_comment: string | null;
  points_awarded: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

const WINDOW_COLUMNS = "id, title, platform, opens_at, closes_at, is_active, created_by, created_at";

const SUBMISSION_COLUMNS =
  "id, window_id, student_id, post_url, status, admin_comment, points_awarded, reviewed_by, reviewed_at, created_at, updated_at";

export async function getActiveSocialWindows(): Promise<SocialWindowRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("social_windows")
    .select(WINDOW_COLUMNS)
    .eq("is_active", true)
    .order("opens_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function getSocialWindowById(windowId: string): Promise<SocialWindowRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("social_windows").select(WINDOW_COLUMNS).eq("id", windowId).maybeSingle();

  if (error || !data) return null;
  return data;
}

// A student can now have any number of submissions per window (the
// unique (window_id, student_id) constraint was dropped), so this returns
// every row across every window -- newest first, matching how the student
// board groups them per window client-side.
export async function getStudentSocialSubmissions(studentId: string): Promise<SocialSubmissionRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("social_submissions")
    .select(SUBMISSION_COLUMNS)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

/**
 * Always inserts a new row -- a student can submit any number of separate
 * posts per window, so there's no existing row to reconcile against
 * (unlike upsertOwnSubmission() in lib/data/taskBoard.ts, which enforces
 * one row per task/student). Defaults to 'pending' via the column default.
 */
export async function createSocialSubmission(
  windowId: string,
  studentId: string,
  postUrl: string,
): Promise<{ submission: SocialSubmissionRow } | { error: string; status: number }> {
  const admin = createAdminClient();

  const { data: inserted, error: insertError } = await admin
    .from("social_submissions")
    .insert({ window_id: windowId, student_id: studentId, post_url: postUrl })
    .select(SUBMISSION_COLUMNS)
    .single();

  if (insertError || !inserted) return { error: "Could not save submission.", status: 500 };
  return { submission: inserted };
}

/**
 * Edits one specific submission by its own id, regardless of its current
 * status -- including 'approved', where flipping status away from
 * 'approved' fires the revoke_social_points_on_status_change trigger,
 * which removes the now-stale points_ledger row. Always resets status to
 * 'pending' and clears every review field (admin_comment, points_awarded,
 * reviewed_by, reviewed_at), since a fresh link means any prior review no
 * longer applies. Ownership (does this submission belong to the requesting
 * student?) is the API route's responsibility, not this function's --
 * mirrors how upsertOwnSubmission() in lib/data/taskBoard.ts leaves task
 * existence/activity checks to its caller.
 */
export async function editSocialSubmission(
  submissionId: string,
  newUrl: string,
): Promise<{ submission: SocialSubmissionRow } | { error: string; status: number }> {
  const admin = createAdminClient();

  const { data: updated, error: updateError } = await admin
    .from("social_submissions")
    .update({
      post_url: newUrl,
      status: "pending",
      admin_comment: null,
      points_awarded: null,
      reviewed_by: null,
      reviewed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .select(SUBMISSION_COLUMNS)
    .maybeSingle();

  if (updateError) return { error: "Could not update submission.", status: 500 };
  if (!updated) return { error: "Submission not found.", status: 404 };
  return { submission: updated };
}

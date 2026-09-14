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

export async function getStudentSocialSubmissions(studentId: string): Promise<SocialSubmissionRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("social_submissions").select(SUBMISSION_COLUMNS).eq("student_id", studentId);

  if (error || !data) return [];
  return data;
}

/**
 * The one write path for a student's own submission, mirroring
 * upsertOwnSubmission() in lib/data/taskBoard.ts. A fresh submission (no
 * existing row for this window/student -- the unique (window_id,
 * student_id) constraint guarantees at most one) always inserts as
 * 'pending'. An existing row can only be resubmitted while it's
 * 'sent_back' -- guarded atomically via `.eq("status", "sent_back")` on the
 * UPDATE itself so a request can never slip through against a row that's
 * already 'pending' or 'approved'.
 */
export async function upsertOwnSocialSubmission(
  windowId: string,
  studentId: string,
  postUrl: string,
): Promise<{ submission: SocialSubmissionRow } | { error: string; status: number }> {
  const admin = createAdminClient();

  const { data: updated, error: updateError } = await admin
    .from("social_submissions")
    .update({ post_url: postUrl, status: "pending", admin_comment: null, updated_at: new Date().toISOString() })
    .eq("window_id", windowId)
    .eq("student_id", studentId)
    .eq("status", "sent_back")
    .select(SUBMISSION_COLUMNS)
    .maybeSingle();

  if (updateError) return { error: "Could not update submission.", status: 500 };
  if (updated) return { submission: updated };

  const { data: existing } = await admin
    .from("social_submissions")
    .select("id")
    .eq("window_id", windowId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (existing) {
    // A row exists but the guarded UPDATE above touched nothing -- the only
    // way that happens is the status filter excluded it, i.e. it's already
    // 'pending' (awaiting review) or 'approved' (locked).
    return { error: "You already have a submission for this window.", status: 409 };
  }

  const { data: inserted, error: insertError } = await admin
    .from("social_submissions")
    .insert({ window_id: windowId, student_id: studentId, post_url: postUrl })
    .select(SUBMISSION_COLUMNS)
    .single();

  if (insertError || !inserted) return { error: "Could not save submission.", status: 500 };
  return { submission: inserted };
}

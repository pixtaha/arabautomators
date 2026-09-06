"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface ReviewRow {
  id: string;
  taskTitle: string;
  points: number;
  username: string;
  submittedAt: string;
}

function formatSubmittedAt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminTaskReviewsClient() {
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(() => {
    fetch("/api/admin/task-reviews")
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews ?? []))
      .catch(() => setReviews([]));
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/task-reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        loadReviews();
        return;
      }
      setReviews((prev) => (prev ?? []).filter((r) => r.id !== id));
    } catch {
      setError("Request failed. Check your connection and try again.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="mx-auto flex max-w-[720px] flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Internal · admin only
            </span>
            <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] text-text-strong">
              Task reviews
            </h1>
            <p className="max-w-[60ch] text-sm leading-relaxed text-text-muted">
              Tasks marked &quot;needs admin review&quot; land here once a student marks them done. Approving awards
              points immediately; rejecting resets the task back to &quot;ready&quot; so the student can resubmit.
            </p>
          </div>

          {error && <p className="text-xs font-medium text-aa-red-700">{error}</p>}

          {reviews === null ? (
            <div className="h-24 animate-pulse rounded-card bg-surface-sunken" />
          ) : reviews.length === 0 ? (
            <p className="text-sm text-text-muted">Nothing pending review right now.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between gap-3 rounded-card-inner border border-border-hairline bg-surface-card px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] tracking-widest text-text-faint uppercase">
                        @{review.username} · {review.points} pt{review.points === 1 ? "" : "s"} ·{" "}
                        {formatSubmittedAt(review.submittedAt)}
                      </span>
                    </div>
                    <div className="truncate text-sm font-semibold text-text-strong">{review.taskTitle}</div>
                  </div>

                  <div className="flex flex-none items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAction(review.id, "reject")}
                      disabled={actingId === review.id}
                      className="cursor-pointer rounded-control border border-border-hairline-strong px-3 py-1.5 text-xs font-semibold text-aa-red-700 transition-colors hover:border-aa-red-500 hover:bg-surface-danger-soft disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(review.id, "approve")}
                      disabled={actingId === review.id}
                      className="cursor-pointer rounded-control bg-surface-brand px-3 py-1.5 text-xs font-semibold text-text-inverse transition-colors hover:bg-surface-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actingId === review.id ? "Working…" : "Approve"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

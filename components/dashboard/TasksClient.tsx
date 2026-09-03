"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { createClient } from "@/lib/supabase/client";
import type { ModuleWithTasks } from "@/lib/data/tasks";

type TaskStatus = "ready" | "done" | "problem";

const STATUS_OPTIONS: { key: TaskStatus; label: string }[] = [
  { key: "ready", label: "Ready" },
  { key: "done", label: "Done" },
  { key: "problem", label: "Have a problem" },
];

const STATUS_CLASSES: Record<TaskStatus, { solid: string; hover: string; dot: string }> = {
  ready: {
    solid: "border-aa-amber-400 bg-aa-amber-400 text-text-strong",
    hover: "hover:border-aa-amber-400 hover:bg-surface-accent-soft hover:text-aa-amber-700",
    dot: "bg-aa-amber-400",
  },
  done: {
    solid: "border-surface-brand bg-surface-brand text-text-inverse",
    hover: "hover:border-surface-brand hover:bg-surface-brand-soft hover:text-text-accent",
    dot: "bg-surface-brand",
  },
  problem: {
    solid: "border-surface-danger bg-surface-danger text-text-inverse",
    hover: "hover:border-surface-danger hover:bg-surface-danger-soft hover:text-aa-red-700",
    dot: "bg-surface-danger",
  },
};

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function formatAvailableDate(iso: string | null) {
  if (!iso) return "TBA";
  return `Available ${new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

function formatOpensDate(iso: string) {
  return `Opens ${new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

function todayLocalIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Both sides are "YYYY-MM-DD" date-only strings (unlock_date is a Postgres
// `date` column), so a plain string comparison is correct and avoids the
// UTC-vs-local-midnight ambiguity of parsing a date-only string with `new
// Date()`.
function isLocked(unlockDate: string | null) {
  if (!unlockDate) return false;
  return unlockDate > todayLocalIso();
}

export function TasksClient({ modules }: { modules: ModuleWithTasks[] }) {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.username as string | undefined) ??
    "there";
  const [status, setStatus] = useState<Map<string, TaskStatus>>(new Map());
  const [statusLoaded, setStatusLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("student_task_status")
      .select("task_id, status")
      .eq("student_id", user.id)
      .then(({ data }) => {
        setStatus(new Map((data ?? []).map((row) => [row.task_id, row.status as TaskStatus])));
        setStatusLoaded(true);
      });
  }, [user]);

  async function toggleStatus(taskId: string, key: TaskStatus) {
    if (!user) return;
    const current = status.get(taskId);
    const supabase = createClient();

    if (current === key) {
      setStatus((prev) => {
        const next = new Map(prev);
        next.delete(taskId);
        return next;
      });
      await supabase.from("student_task_status").delete().eq("task_id", taskId).eq("student_id", user.id);
      return;
    }

    setStatus((prev) => new Map(prev).set(taskId, key));
    await supabase
      .from("student_task_status")
      .upsert(
        { task_id: taskId, student_id: user.id, status: key, updated_at: new Date().toISOString() },
        { onConflict: "task_id,student_id" },
      );
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
        <Header />
        <main className="relative flex-1 overflow-hidden">
          <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />
          <div className="relative mx-auto flex max-w-[880px] flex-col gap-6 px-4 py-16 sm:px-6">
            <div className="h-8 w-64 animate-pulse rounded-control bg-surface-sunken" />
            <div className="h-40 animate-pulse rounded-card bg-surface-sunken" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />

        <div className="relative mx-auto flex max-w-[880px] flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">My tasks</span>
            <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] text-text-strong sm:text-[40px]">
              {displayName}&apos;s Tasks <span aria-hidden="true">⚡</span>
            </h1>
            <p className="max-w-[60ch] text-sm leading-relaxed text-text-muted">
              Mark a task ready, done, or blocked as you work. Locked tasks open on their date.
            </p>
          </div>

          {modules.length === 0 ? (
            <div className="rounded-card border border-border-hairline bg-surface-card p-6 text-sm text-text-muted shadow-card">
              No tasks yet — check back once your modules are set up.
            </div>
          ) : (
            modules.map((module) => {
              const unlockedTasks = module.tasks.filter((t) => !isLocked(t.unlock_date));
              const doneCount = unlockedTasks.filter((t) => status.get(t.id) === "done").length;
              const no = String(module.order_index).padStart(2, "0");

              return (
                <div
                  key={module.id}
                  className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card"
                >
                  <div className="flex flex-wrap items-center gap-4.5">
                    <span className="flex h-[30px] min-w-[46px] flex-none items-center justify-center rounded-full bg-surface-brand px-3 font-mono text-[13px] font-bold text-white">
                      {no}
                    </span>
                    <div className="min-w-[240px] flex-1">
                      <h2 className="font-display text-[20px] leading-[1.15] font-extrabold tracking-tight text-text-strong sm:text-[24px]">
                        {module.title}
                      </h2>
                    </div>
                    <div className="ml-auto flex flex-none flex-col items-end gap-1 text-right">
                      <span className="font-mono text-[11px] tracking-widest text-text-faint uppercase">
                        {formatAvailableDate(module.available_date)}
                      </span>
                      {statusLoaded && (
                        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                          {doneCount} / {unlockedTasks.length} done
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {module.tasks.map((task) => {
                      const locked = isLocked(task.unlock_date);
                      const active = status.get(task.id);
                      const hasDetail = Boolean(task.description || task.description_ar);

                      return (
                        <div
                          key={task.id}
                          className={`group/task flex flex-col gap-3 rounded-card-inner border border-border-hairline p-4 transition-[transform,background-color] duration-200 ease-[var(--ease-smooth)] ${
                            locked ? "bg-surface-sunken opacity-60" : "bg-surface-card hover:scale-[1.015] hover:bg-surface-hover"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-3.5">
                            <span
                              className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border font-mono text-xs font-bold ${
                                locked
                                  ? "border-border-hairline text-text-faint"
                                  : "border-border-hairline-strong bg-surface-sunken text-text-muted"
                              }`}
                            >
                              {String(task.order_index).padStart(2, "0")}
                            </span>

                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <p
                                className={`text-[15px] leading-snug font-semibold ${
                                  locked ? "text-text-muted" : "text-text-strong"
                                } ${active === "done" ? "text-text-muted line-through decoration-text-faint" : ""}`}
                              >
                                {task.title}
                              </p>
                              {!locked && task.title_ar && (
                                <p dir="rtl" className="mt-0.5 text-left text-[12.5px] text-text-faint">
                                  {task.title_ar}
                                </p>
                              )}
                            </div>

                            {locked ? (
                              <div className="flex flex-none items-center gap-1.5 text-text-faint">
                                <LockIcon className="h-3.5 w-3.5" />
                                <span className="font-mono text-[11px] tracking-widest whitespace-nowrap uppercase">
                                  {task.unlock_date ? formatOpensDate(task.unlock_date) : ""}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-none items-center gap-1.5">
                                {STATUS_OPTIONS.map((option) => {
                                  const isActive = active === option.key;
                                  const classes = STATUS_CLASSES[option.key];
                                  return (
                                    <button
                                      key={option.key}
                                      type="button"
                                      aria-pressed={isActive}
                                      onClick={() => toggleStatus(task.id, option.key)}
                                      className={`group flex h-6 cursor-pointer items-center rounded-full border px-2 transition-[transform,background-color,border-color,color] duration-150 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[.985] ${
                                        isActive ? classes.solid : `border-transparent text-text-faint ${classes.hover}`
                                      }`}
                                    >
                                      <span
                                        className={`h-2.5 w-2.5 flex-none rounded-full ${isActive ? "bg-current" : classes.dot}`}
                                      />
                                      <span
                                        className={`grid transition-[grid-template-columns] duration-300 ease-[var(--ease-smooth)] ${
                                          isActive ? "grid-cols-[1fr]" : "grid-cols-[0fr] group-hover:grid-cols-[1fr]"
                                        }`}
                                      >
                                        <span className="min-w-0 overflow-hidden">
                                          <span className="block pl-1.5 font-mono text-[10.5px] font-bold tracking-widest whitespace-nowrap uppercase">
                                            {option.label}
                                          </span>
                                        </span>
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {!locked && hasDetail && (
                            <div className="grid grid-rows-[0fr] transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-smooth)] group-hover/task:grid-rows-[1fr]">
                              <div className="overflow-hidden opacity-0 transition-opacity duration-300 ease-[var(--ease-smooth)] group-hover/task:opacity-100">
                                <div className="flex flex-col gap-1 border-t border-border-hairline pt-3">
                                  {task.description && (
                                    <p className="text-[13.5px] leading-relaxed text-text-body">{task.description}</p>
                                  )}
                                  {task.description_ar && (
                                    <p dir="rtl" className="text-left text-[12.5px] leading-relaxed text-text-faint">
                                      {task.description_ar}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

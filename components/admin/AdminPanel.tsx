import type { ReactNode } from "react";
import { Wordmark } from "@/components/layout/Wordmark";
import { Button } from "@/components/ui/Button";

export interface AdminPanelProps {
  /** Visitors currently on the site. Rendered as-is -- wire this to real-time data from the caller. */
  liveVisitorCount: number;
  /** Total site opens recorded since launch. Rendered as-is -- wire this to real data from the caller. */
  totalSiteOpens: number;
}

// Illustrative counts that aren't part of this component's live-data contract
// yet (only liveVisitorCount/totalSiteOpens are, per the props above). Kept
// as plain constants so the panel's layout can be reviewed before those are
// wired up too.
const PEAK_CONCURRENT_TODAY = 61;
const OPENS_TODAY = 412;
const TOTAL_STUDENTS = 33;
const PENDING_TASK_REVIEWS = 7;
const NEW_SUBMISSIONS = 7;

const ONLINE_NOW = [
  { name: "Omar Khaled", handle: "@omar.k", page: "/module/04", since: "12m" },
  { name: "Sara Nabil", handle: "@sara_n", page: "/task-board", since: "8m" },
  { name: "Hassan Adel", handle: "@hassan.adel", page: "/library", since: "5m" },
  { name: "Mona Fathy", handle: "@monaf", page: "/leaderboard", since: "3m" },
  { name: "Youssef Amr", handle: "@yamr", page: "/module/02", since: "1m" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function EyebrowLabel({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">{children}</span>;
}

function ActionSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <EyebrowLabel>{label}</EyebrowLabel>
      <div className="mt-3.5 flex flex-wrap items-center gap-2.5">{children}</div>
    </div>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="6" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 13c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10 6a2 2 0 1 1 2.2 2M12.5 9.6c1.6.3 2.5 1.4 2.5 3.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ClipboardCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="2.8" width="10" height="11.4" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 2.4h4a1 1 0 0 1 1 1v.7H5v-.7a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.8 8.6 7.4 10.2 10.4 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GraduationCapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M1.5 6.2 8 3.5l6.5 2.7L8 8.9 1.5 6.2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M4 7.6v3c0 .9 1.8 1.9 4 1.9s4-1 4-1.9v-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M14 6.2v3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M8 10.2V2.6M5.2 5.4 8 2.6l2.8 2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 10v2a1.5 1.5 0 0 0 1.5 1.5h8A1.5 1.5 0 0 0 13.5 12v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M8 4.2c-1-1-2.6-1.4-4.3-1.2-.6.1-1 .6-1 1.2v7.2c0 .5.4.9.9.9 1.6-.1 3.3.2 4.4 1.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 4.2c1-1 2.6-1.4 4.3-1.2.6.1 1 .6 1 1.2v7.2c0 .5-.4.9-.9.9-1.6-.1-3.3.2-4.4 1.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 4.2v9.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ListChecksIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M2 3.6 3 4.6 5 2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 8.4 3 9.4l2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 13.2 3 14.2l2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.3 3.5h6.7M7.3 8.3h6.7M7.3 13.1h6.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M4.5 2.5h7v3.4a3.5 3.5 0 0 1-7 0V2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M4.5 3.4H2.8a1 1 0 0 0-1 1.2c.3 1.5 1.2 2.5 2.7 2.8M11.5 3.4h1.7a1 1 0 0 1 1 1.2c-.3 1.5-1.2 2.5-2.7 2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 9.4v2.2M5.7 13.5c0-1.2 1-1.9 2.3-1.9s2.3.7 2.3 1.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M8 2.2 9.7 6l4.1.4-3.1 2.8.9 4-3.6-2.1-3.6 2.1.9-4-3.1-2.8L6.3 6 8 2.2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M2.5 8.6h3.1l1 1.6h2.8l1-1.6h3.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.3 4 2.5 8.6v3a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3L12.7 4a1 1 0 0 0-1-.8H4.3a1 1 0 0 0-1 .8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M6.5 9.5 9.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M7.3 4.6 8.5 3.4a2.4 2.4 0 0 1 3.4 3.4L10.7 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8.7 11.4 7.5 12.6a2.4 2.4 0 0 1-3.4-3.4L5.3 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function WorkflowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="3" cy="4" r="1.6" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="13" cy="4" r="1.6" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="12" r="1.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.4 5 7 10.6M11.6 5 9 10.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function FlaskIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M6.2 2.5h3.6M6.8 2.5v3.9L3.4 12a1.3 1.3 0 0 0 1.1 2h7l-.1-.1a1.3 1.3 0 0 0 1.1-1.9L9.2 6.4V2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.6h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="5" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7.3 9.8 13.5 3.6M11.4 5.7l1.6 1.6M9.6 7.5l1.2 1.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminPanel({ liveVisitorCount, totalSiteOpens }: AdminPanelProps) {
  return (
    <div dir="ltr" lang="en" className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <header className="sticky top-0 z-30 border-b-2 border-border-hairline bg-surface-card shadow-sm">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
          <Wordmark />
          <span className="hidden h-6 w-px flex-none bg-border-hairline sm:block" />
          <h1 className="min-w-0 flex-1 truncate font-display text-lg font-bold tracking-tight text-text-strong">
            Admin panel
          </h1>
          <div className="flex flex-none items-center gap-2 rounded-full border border-aa-green-100 bg-surface-brand-soft px-3 py-1.5">
            <span className="h-2 w-2 flex-none animate-blink rounded-full bg-surface-brand" />
            <span className="font-mono text-[11px] font-semibold text-aa-green-800">Connected</span>
          </div>
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        <div className="bg-dots mask-fade-b pointer-events-none absolute inset-0 bg-surface-page" />

        <div className="relative mx-auto flex max-w-[1180px] flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="group relative min-w-0">
              <div className="flex flex-col gap-2.5 rounded-card border border-t-4 border-border-hairline border-t-surface-brand bg-surface-card p-5 shadow-card sm:p-6">
                <div className="flex items-center gap-2">
                  <span className="h-[7px] w-[7px] flex-none animate-blink rounded-full bg-surface-brand" />
                  <EyebrowLabel>Live</EyebrowLabel>
                </div>
                <div className="text-base font-semibold text-text-strong">On the site right now</div>
                <div className="font-mono text-[40px] leading-none font-bold tracking-tighter text-text-strong tabular-nums sm:text-[48px]">
                  {formatNumber(liveVisitorCount)}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-sm text-text-muted">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-text-accent">{formatNumber(PEAK_CONCURRENT_TODAY)}</span>
                    <span>peak concurrent today</span>
                  </div>
                  <span className="text-xs text-text-faint">Hover to see who</span>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 top-full z-20 -translate-y-1 pt-2 opacity-0 transition-[opacity,transform] duration-300 ease-[var(--ease-smooth)] group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                <div className="overflow-hidden rounded-card border border-border-hairline bg-surface-card shadow-lg">
                  <div className="flex items-center justify-between gap-3 border-b-2 border-border-hairline px-4 py-3">
                    <EyebrowLabel>Accounts open now</EyebrowLabel>
                    <span className="font-mono text-text-strong">{formatNumber(ONLINE_NOW.length)}</span>
                  </div>
                  <div className="flex flex-col">
                    {ONLINE_NOW.map((user) => (
                      <div
                        key={user.handle}
                        className="flex items-center gap-3 border-b border-aa-neutral-200 px-4 py-2.5 last:border-b-0"
                      >
                        <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-surface-brand-soft font-display text-xs font-bold text-text-accent">
                          {user.name.charAt(0)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-text-strong">{user.name}</div>
                          <div className="font-mono text-xs text-text-muted">{user.handle}</div>
                        </div>
                        <div className="flex-none text-end">
                          <div className="font-mono text-xs text-text-body">{user.page}</div>
                          <div className="font-mono text-[11px] text-text-faint">{user.since}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-surface-sunken px-4 py-2.5 text-xs text-text-muted">
                    No profile photos uploaded yet — initials shown instead.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-card border border-t-4 border-border-hairline border-t-surface-accent bg-surface-card p-5 shadow-card sm:p-6">
              <EyebrowLabel>Since launch</EyebrowLabel>
              <div className="mt-2.5 text-base font-semibold text-text-strong">Total site opens</div>
              <div className="mt-3 font-mono text-[40px] leading-none font-bold tracking-tighter text-aa-amber-700 tabular-nums sm:text-[48px]">
                {formatNumber(totalSiteOpens)}
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5 text-sm text-text-muted">
                <span className="font-mono text-text-strong">{formatNumber(OPENS_TODAY)}</span>
                <span>opens today</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-card border border-border-hairline bg-surface-card p-5 shadow-card">
              <div className="flex items-center gap-2 text-text-muted">
                <UsersIcon className="h-[18px] w-[18px]" />
                <span className="text-xs font-semibold text-text-body">Total students</span>
              </div>
              <div className="mt-4 font-mono text-3xl font-bold tracking-tight text-text-strong">
                {formatNumber(TOTAL_STUDENTS)}
              </div>
              <div className="mt-1.5 text-xs text-text-muted">Enrolled in Round #01</div>
            </div>

            <div className="rounded-card border border-border-hairline bg-surface-card p-5 shadow-card">
              <div className="flex items-center gap-2 text-text-muted">
                <ClipboardCheckIcon className="h-[18px] w-[18px]" />
                <span className="text-xs font-semibold text-text-body">Task-board reviews</span>
              </div>
              <div className="mt-4 font-mono text-3xl font-bold tracking-tight text-text-strong">
                {formatNumber(PENDING_TASK_REVIEWS)}
              </div>
              <div className="mt-1.5 text-xs text-text-muted">Waiting on your review</div>
            </div>
          </div>

          <div className="flex flex-col gap-7">
            <ActionSection label="Students & content">
              <Button variant="secondary">
                <UsersIcon className="h-[18px] w-[18px]" />
                Manage students
              </Button>
              <Button variant="secondary">
                <GraduationCapIcon className="h-[18px] w-[18px]" />
                Modules & sessions
              </Button>
              <Button variant="secondary">
                <UploadIcon className="h-[18px] w-[18px]" />
                Upload a session
              </Button>
              <Button variant="secondary">
                <BookOpenIcon className="h-[18px] w-[18px]" />
                Snippet library
              </Button>
            </ActionSection>

            <ActionSection label="Engagement">
              <Button variant="secondary">
                <ListChecksIcon className="h-[18px] w-[18px]" />
                Quizzes
              </Button>
              <Button variant="secondary">
                <TrophyIcon className="h-[18px] w-[18px]" />
                Leaderboard
              </Button>
              <Button variant="secondary">
                <StarIcon className="h-[18px] w-[18px]" />
                Points
              </Button>
            </ActionSection>

            <ActionSection label="Social submissions">
              <Button variant="secondary">
                <InboxIcon className="h-[18px] w-[18px]" />
                Review submissions
              </Button>
              <span className="inline-flex h-6 items-center rounded-full bg-surface-sunken px-2.5 font-mono text-[11px] font-semibold text-text-muted">
                {NEW_SUBMISSIONS} new
              </span>
              <Button variant="secondary">
                <LinkIcon className="h-[18px] w-[18px]" />
                Submitted links
              </Button>
            </ActionSection>

            <ActionSection label="Infrastructure">
              <Button variant="ink">
                <WorkflowIcon className="h-[18px] w-[18px]" />
                Push workflow to students
              </Button>
              <Button variant="secondary">
                <FlaskIcon className="h-[18px] w-[18px]" />
                API Lab
              </Button>
              <Button variant="secondary">
                <KeyIcon className="h-[18px] w-[18px]" />
                OpenRouter keys
              </Button>
            </ActionSection>
          </div>
        </div>
      </main>
    </div>
  );
}

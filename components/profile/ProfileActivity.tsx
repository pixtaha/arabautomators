import { CheckIcon, ActivityIcon, WorkflowIcon, CodeIcon, UsersIcon } from "@/components/profile/icons";

const ACTIVITY = [
  {
    icon: CheckIcon,
    color: "text-surface-brand",
    title: "Completed module 04 — Error handling",
    detail: "Session 3 · error trigger walkthrough",
    when: "2h",
  },
  {
    icon: ActivityIcon,
    color: "text-text-body",
    title: "Earned 50 points",
    detail: "Shipped a workflow with 0 failed runs",
    when: "1d",
  },
  {
    icon: WorkflowIcon,
    color: "text-text-body",
    title: 'Published "Invoice intake → Supabase"',
    detail: "412 runs · 0.2% failure rate",
    when: "3d",
  },
  {
    icon: CodeIcon,
    color: "text-text-body",
    title: "Added a snippet to the library",
    detail: "Retry wrapper for flaky webhooks",
    when: "6d",
  },
  {
    icon: UsersIcon,
    color: "text-text-body",
    title: "Joined office hours",
    detail: "Rate limits and backoff",
    when: "1w",
  },
];

export function ProfileActivity() {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-4 w-[3px] bg-black" />
          <span className="font-mono text-[11px] tracking-widest text-text-strong uppercase">
            Recent activity
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-muted">
          <span className="animate-blink block h-1.5 w-1.5 rounded-full bg-text-faint" />
          demo data
        </span>
      </div>

      <div className="flex flex-col">
        {ACTIVITY.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 border-b border-aa-neutral-200 py-3.5 last:border-b-0"
          >
            <span
              className={`grid h-7 w-7 flex-none place-items-center rounded-full bg-surface-sunken ${item.color}`}
            >
              <item.icon className="h-[15px] w-[15px]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-text-strong">{item.title}</div>
              <div className="text-sm text-text-muted">{item.detail}</div>
            </div>
            <span className="whitespace-nowrap font-mono text-xs text-text-faint">{item.when}</span>
          </div>
        ))}
      </div>

      <p className="pt-3 text-xs text-text-muted">
        Demo data — your real activity shows up here once Round #01 starts.
      </p>
    </div>
  );
}

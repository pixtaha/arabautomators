function AlertTriangleIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-[17px] w-[17px] flex-none text-surface-accent" aria-hidden="true">
      <path
        d="M8 2.5l6.5 11.2H1.5L8 2.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M8 6.5v3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="11.6" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function SessionWarningCallout({ title, body }: { title: string; body: string | null }) {
  return (
    <div className="flex items-start gap-3 rounded-card border border-border-hairline border-l-4 border-l-surface-accent bg-surface-card p-4.5 shadow-card">
      <AlertTriangleIcon />
      <div>
        <div className="text-sm font-semibold text-text-strong">{title}</div>
        {body && <div className="mt-1 text-sm text-text-muted">{body}</div>}
      </div>
    </div>
  );
}

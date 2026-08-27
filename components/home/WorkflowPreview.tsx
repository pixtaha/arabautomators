const steps = [
  {
    no: "01",
    name: "webhook",
    description: "New client fills the intake form",
    meta: "200 OK",
    accent: "border-l-surface-brand",
  },
  {
    no: "02",
    name: "supabase.insert",
    description: "Client, project and invoice rows created",
    meta: "12 rows",
    accent: "border-l-surface-brand",
  },
  {
    no: "03",
    name: "error trigger",
    description: "API timed out, recovered without you",
    meta: "retry ×2",
    accent: "border-l-surface-accent",
  },
];

const metrics = [
  { label: "Runs / month", value: "2,379" },
  { label: "Failed runs", value: "0.4%" },
  { label: "Hours saved", value: "61h" },
];

export function WorkflowPreview() {
  return (
    <div
      id="workflow"
      className="flex scroll-mt-24 flex-col gap-3.5 rounded-card border border-border-hairline bg-surface-card p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
          Live run · client-onboarding
        </span>
        <span className="font-mono text-[11px] text-surface-brand">1.8s · run #2379</span>
      </div>

      <div className="bg-grid relative flex flex-col gap-3 overflow-hidden rounded-card-inner bg-surface-sunken p-5">
        <div className="animate-run absolute top-0 bottom-0 left-[-18%] w-[14%] bg-[linear-gradient(90deg,transparent,rgba(0,120,88,.10),transparent)]" />

        {steps.map((step, index) => (
          <div key={step.no}>
            <div
              className={`relative flex items-center gap-3.5 rounded-[10px] border border-border-hairline ${step.accent} border-l-4 bg-surface-card px-3.5 py-3`}
            >
              <span className="font-mono text-[11px] text-text-faint">{step.no}</span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-mono text-[13px] text-text-strong">{step.name}</span>
                <span className="text-[11px] text-text-muted">{step.description}</span>
              </span>
              <span className="ml-auto font-mono text-[11px] text-text-muted">{step.meta}</span>
            </div>
            {index < steps.length - 1 && (
              <div className="relative ml-[26px] h-3.5 border-l-2 border-aa-neutral-400" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-card-inner bg-surface-sunken px-3.5 py-3">
            <div className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
              {metric.label}
            </div>
            <div className="mt-1 font-display text-[22px] font-extrabold tracking-tight text-text-strong">
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

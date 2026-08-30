const STATS = [
  { label: "Points", value: "340", unit: "", accent: false },
  { label: "Modules", value: "2", unit: "/ 11", accent: false },
  { label: "Streak", value: "12", unit: "days", accent: false },
  { label: "Rank", value: "#7", unit: "of 342", accent: true },
];

export function ProfileStats() {
  return (
    <div className="overflow-hidden rounded-card border border-border-hairline bg-surface-card shadow-card">
      <div className="flex items-center justify-between border-b border-border-hairline px-6 py-3">
        <span className="font-mono text-[11px] tracking-widest text-text-faint uppercase">Stats</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-muted">
          <span className="animate-blink block h-1.5 w-1.5 rounded-full bg-text-faint" />
          demo data
        </span>
      </div>
      <div className="flex flex-wrap">
        {STATS.map((stat, index) => (
          <div
            key={stat.label}
            className={`min-w-[140px] flex-1 px-6 py-4 ${
              index < STATS.length - 1 ? "border-r border-border-hairline" : ""
            }`}
          >
            <div className="font-mono text-[11px] tracking-widest text-text-faint uppercase">{stat.label}</div>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span
                className={`font-mono text-[26px] leading-none font-black tracking-tight ${
                  stat.accent ? "text-text-accent" : "text-text-strong"
                }`}
              >
                {stat.value}
              </span>
              {stat.unit && <span className="text-sm text-text-faint">{stat.unit}</span>}
            </div>
          </div>
        ))}
      </div>
      <p className="border-t border-border-hairline px-6 py-3 text-xs text-text-muted">
        Preview only — real stats start counting once Round #01 begins.
      </p>
    </div>
  );
}

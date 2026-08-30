import { getActiveStudentCount } from "@/lib/data/students";

export async function StatsBar() {
  const activeStudentCount = await getActiveStudentCount();

  const stats = [
    {
      value: activeStudentCount !== null ? String(activeStudentCount) : "—",
      label: "Seats taken · interview passed",
    },
    { status: true, label: "Round #2 enrollment" },
    { value: "11", label: "Sections · one workflow each" },
    { value: "6", suffix: " weeks", label: "Live, in Arabic" },
  ];

  return (
    <section className="border-y border-border-hairline bg-surface-card">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2 border-b-2 border-black py-[18px] sm:py-[22px]">
          <span className="font-display text-lg font-extrabold tracking-tight text-text-strong sm:text-xl">
            Round #01 is on the canvas right now
          </span>
          <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
            05.09.2026 → 01.11.2026 · seats close at interview
          </span>
        </div>
      </div>
      <div className="mx-auto grid max-w-[1180px] grid-cols-2 px-4 sm:grid-cols-4 sm:px-6">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`py-7 pr-6 ${
              index < stats.length - 1 ? "border-r border-border-hairline" : ""
            } ${index === 0 ? "pl-0" : "pl-6"}`}
          >
            {stat.status ? (
              <div className="inline-flex cursor-default items-center gap-2 font-display text-[26px] font-extrabold tracking-tighter text-text-strong sm:text-[34px]">
                <span className="animate-blink block h-2.5 w-2.5 flex-none rounded-full bg-aa-neutral-500" />
                Closed
              </div>
            ) : (
              <div className="cursor-default font-display text-[30px] font-extrabold tracking-tighter text-text-strong transition-colors duration-300 ease-out hover:text-surface-brand sm:text-[42px]">
                {stat.value}
                {stat.suffix && <span className="text-2xl">{stat.suffix}</span>}
              </div>
            )}
            <div className="mt-1.5 font-mono text-[11px] tracking-widest text-text-muted uppercase">
              {stat.status ? "Reopening soon" : stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

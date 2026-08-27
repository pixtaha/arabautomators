const team = [
  { name: "Pixtaha", role: "AI automation engineer" },
  { name: "Abdallah Hellal", role: "AI automation engineer" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-surface-ink text-white">
      <div className="bg-dots-ink mask-fade-b absolute inset-0" />
      <div className="relative mx-auto flex max-w-[1180px] flex-col gap-8 px-4 pb-10 pt-12 sm:gap-12 sm:px-6 sm:pt-16 md:pt-[72px]">
        <div className="grid grid-cols-1 items-center gap-7 sm:grid-cols-2 md:gap-16">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="block h-2.5 w-2.5 rounded-full bg-surface-brand" />
              <span className="font-display text-[22px] font-extrabold tracking-tight text-white">
                A.AUTOMATORS
              </span>
            </div>
            <p className="max-w-[44ch] text-sm leading-relaxed text-aa-neutral-400">
              Run by two people. Applications are reviewed every Sunday.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[11px] tracking-widest text-aa-neutral-500 uppercase">
              Company page
            </span>
            <div
              aria-disabled="true"
              className="flex min-h-[76px] cursor-not-allowed items-center gap-4 rounded-2xl bg-[linear-gradient(100deg,#0b5d47_0%,#0f6a51_26%,#178f6d_50%,#0f6a51_74%,#0b5d47_100%)] bg-[length:260%_100%] px-[22px] py-4 text-white [animation:aa-sheen_5.1s_var(--ease-smooth)_infinite_alternate,aa-pulse_2800ms_var(--ease-smooth)_infinite]"
            >
              <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[9px] bg-white font-display text-lg font-extrabold tracking-tight text-[#0b5d47]">
                in
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-display text-[15px] font-extrabold tracking-tight text-white sm:text-lg">
                  Follow Arab Automators on LinkedIn
                </span>
                <span className="font-mono text-[10px] tracking-widest text-white/72 uppercase">
                  Page goes live with Round #01
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {team.map((person) => (
            <div
              key={person.name}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/14 border-l-4 border-l-surface-brand px-5 py-[18px]"
            >
              <div className="flex flex-col gap-1">
                <span className="font-display text-[17px] font-bold text-white">{person.name}</span>
                <span className="font-mono text-[11px] text-aa-neutral-500">{person.role}</span>
              </div>
              <div className="flex gap-2">
                <a
                  href="#"
                  className="rounded-full bg-surface-brand px-4 py-2.5 font-mono text-xs font-semibold text-white transition-colors hover:bg-aa-green-700 hover:text-white"
                >
                  LinkedIn
                </a>
                <a
                  href="#"
                  className="rounded-full bg-white px-4 py-2.5 font-mono text-xs font-semibold text-black transition-opacity hover:text-black hover:opacity-[.82]"
                >
                  TikTok
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/14 pt-6 font-mono text-[11px] text-aa-neutral-500">
          <span>© 2026 Arab Automators</span>
          <span>Round #01 · 32 seats taken · 47 in interview</span>
        </div>
      </div>
    </footer>
  );
}

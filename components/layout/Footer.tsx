import { Wordmark } from "@/components/layout/Wordmark";

const team = [
  {
    name: "Pixtaha",
    role: "AI automation engineer",
    linkedin: "https://www.linkedin.com/in/pixtaha",
    tiktok: "https://www.tiktok.com/@pixtaha.dev",
  },
  {
    name: "Abdallah Hellal",
    role: "AI automation engineer",
    linkedin: "https://www.linkedin.com/in/abdallah-hilal/",
    tiktok: "https://www.tiktok.com/@abdallah_helal_ai",
  },
];

function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM.25 8.25h4.5V24H.25zM8.5 8.25h4.31v2.15h.06c.6-1.14 2.07-2.34 4.26-2.34 4.56 0 5.4 3 5.4 6.9V24h-4.5v-7.9c0-1.88-.03-4.3-2.62-4.3-2.62 0-3.02 2.05-3.02 4.16V24H8.5z" />
    </svg>
  );
}

function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.4a2.59 2.59 0 1 1-1.83-2.48V9.75a5.7 5.7 0 1 0 4.93 5.65V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.29 4.29 0 0 1-3.24-1.48z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-surface-ink text-white">
      <div className="bg-dots-ink mask-fade-b absolute inset-0" />
      <div className="relative mx-auto flex max-w-[1180px] flex-col gap-8 px-4 pb-10 pt-12 sm:gap-12 sm:px-6 sm:pt-16 md:pt-[72px]">
        <div className="grid grid-cols-1 items-center gap-7 sm:grid-cols-2 md:gap-16">
          <div className="flex flex-col gap-4">
            <Wordmark variant="light" size="lg" />
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
              <span className="grid h-10 w-10 flex-none place-items-center rounded-[9px] bg-white text-[#0b5d47]">
                <LinkedInIcon width={20} height={20} />
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
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-surface-brand bg-white/10 px-5 py-[18px] backdrop-blur-md transition-colors duration-200 hover:bg-white/[.14]"
            >
              <div className="flex flex-col gap-1">
                <span className="font-display text-[17px] font-bold text-white">{person.name}</span>
                <span className="font-mono text-[11px] text-aa-neutral-500">{person.role}</span>
              </div>
              <div className="flex gap-2">
                <a
                  href={person.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${person.name} on LinkedIn`}
                  className="grid h-[38px] w-[38px] place-items-center rounded-[10px] bg-surface-brand text-white transition-[background-color,transform] duration-150 hover:-translate-y-0.5 hover:bg-aa-green-700"
                >
                  <LinkedInIcon />
                </a>
                <a
                  href={person.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${person.name} on TikTok`}
                  className="grid h-[38px] w-[38px] place-items-center rounded-[10px] bg-white text-black transition-[opacity,transform] duration-150 hover:-translate-y-0.5 hover:opacity-[.82]"
                >
                  <TikTokIcon />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-white/14 pt-6 font-mono text-[11px] text-aa-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Arab Automators</span>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className="whitespace-nowrap">Round #01</span>
            <span aria-hidden="true">·</span>
            <span className="whitespace-nowrap">32 seats taken</span>
            <span aria-hidden="true">·</span>
            <span className="whitespace-nowrap">47 in interview</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

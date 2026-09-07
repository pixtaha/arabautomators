import type { CourseSessionRow } from "@/lib/data/courseSessions";

export function SessionHeader({ session }: { session: CourseSessionRow }) {
  return (
    <div className="flex flex-col gap-3.5">
      <h1 className="font-display text-[32px] leading-[1.05] font-extrabold tracking-[-0.03em] text-text-strong text-balance sm:text-4xl">
        {session.title}
      </h1>

      {session.description && (
        <p className="max-w-[68ch] text-base leading-relaxed text-text-body">{session.description}</p>
      )}

      {session.tags && session.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {session.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex h-6 items-center rounded-lg border border-border-hairline bg-surface-card px-2.5 font-mono text-xs text-text-body"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

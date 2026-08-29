import type { CourseSessionRow } from "@/lib/data/courseSessions";

export function SessionNotesCard({ session }: { session: CourseSessionRow }) {
  const hasContent =
    session.summary_ar || session.notes || (session.covered_topics && session.covered_topics.length > 0) || session.homework;

  if (!hasContent) return null;

  const paragraphs = session.notes ? session.notes.split(/\n{2,}/).filter(Boolean) : [];

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
      <div>
        <div className="mb-2.5 h-[3px] w-10 bg-surface-ink" />
        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">Session notes</span>
      </div>

      {session.summary_ar && (
        <p dir="rtl" className="max-w-[68ch] font-body text-lg leading-relaxed text-text-body">
          {session.summary_ar}
        </p>
      )}

      {paragraphs.map((p, i) => (
        <p key={i} className="max-w-[68ch] text-base leading-relaxed text-text-body">
          {p}
        </p>
      ))}

      {session.covered_topics && session.covered_topics.length > 0 && (
        <div className="rounded-card-inner bg-surface-sunken px-5 py-4">
          <div className="mb-3 font-mono text-[11px] tracking-widest text-text-muted uppercase">
            Covered in this session
          </div>
          <ul className="flex flex-col gap-2 pl-5 text-sm text-text-body">
            {session.covered_topics.map((topic) => (
              <li key={topic} className="list-disc">
                {topic}
              </li>
            ))}
          </ul>
        </div>
      )}

      {session.homework && (
        <div className="border-l-4 border-surface-brand py-0.5 pl-4">
          <p className="max-w-[68ch] text-base font-semibold text-text-strong">{session.homework}</p>
        </div>
      )}
    </div>
  );
}

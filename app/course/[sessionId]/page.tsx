import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdjacentSessions, getCourseSessionData } from "@/lib/data/courseSessions";
import { SessionRail } from "@/components/course/SessionRail";
import { SessionVideoHero } from "@/components/course/SessionVideoHero";
import { SessionNotesCard } from "@/components/course/SessionNotesCard";
import { SessionResourcesPanel } from "@/components/course/SessionResourcesPanel";

export async function generateMetadata(props: PageProps<"/course/[sessionId]">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { title: "Session — Arab Automators" };

  const { sessionId } = await props.params;
  const data = await getCourseSessionData(sessionId);
  return { title: data ? `${data.session.title} — Arab Automators` : "Session — Arab Automators" };
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-[17px] w-[17px]" aria-hidden="true">
      <path
        d={direction === "left" ? "M10 3.5L5 8l5 4.5" : "M6 3.5L11 8l-5 4.5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function CourseSessionPage(props: PageProps<"/course/[sessionId]">) {
  const { sessionId } = await props.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getCourseSessionData(sessionId);
  if (!data) notFound();

  const { session, module, moduleSessions, resources } = data;
  const { prev, next } = getAdjacentSessions(moduleSessions, session.id);

  return (
    <div className="min-h-screen bg-surface-sunken">
      <div className="mx-auto grid max-w-[1400px] items-start gap-4 p-4 lg:grid-cols-[272px_minmax(0,1fr)_344px]">
        <SessionRail moduleTitle={module?.title ?? "Module"} sessions={moduleSessions} currentSessionId={session.id} />

        <main className="flex min-w-0 flex-col gap-4">
          <SessionVideoHero session={session} module={module} />
          <SessionNotesCard session={session} />

          {(prev || next) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {prev ? (
                <Link
                  href={`/course/${prev.id}`}
                  className="flex items-center gap-3.5 rounded-card border border-border-hairline bg-surface-card p-4.5 shadow-card transition-[transform,box-shadow] duration-150 ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-surface-sunken text-text-strong">
                    <ArrowIcon direction="left" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-[11px] tracking-widest text-text-muted uppercase">
                      Previous session
                    </span>
                    <span className="mt-1 block truncate font-display text-[15px] font-bold tracking-tight text-text-strong">
                      {prev.title}
                    </span>
                  </span>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  href={`/course/${next.id}`}
                  className="flex items-center justify-end gap-3.5 rounded-card border border-border-hairline bg-surface-card p-4.5 text-right shadow-card transition-[transform,box-shadow] duration-150 ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-[11px] tracking-widest text-text-muted uppercase">
                      Next session
                    </span>
                    <span className="mt-1 block truncate font-display text-[15px] font-bold tracking-tight text-text-strong">
                      {next.title}
                    </span>
                  </span>
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-surface-ink text-white">
                    <ArrowIcon direction="right" />
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </div>
          )}
        </main>

        <aside className="flex flex-col gap-4">
          <SessionResourcesPanel resources={resources} />
        </aside>
      </div>
    </div>
  );
}
